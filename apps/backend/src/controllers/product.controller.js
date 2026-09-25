// @ts-nocheck
// oxlint-disable unicorn/no-null no-use-before-define
import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import {
	deleteProductImage as deleteCloudinaryImage,
	uploadProductImage as uploadCloudinaryImage,
} from "../lib/cloudinary.js";
import { paginate, parsePagination } from "../lib/pagination.js";
import {
	productListCacheKey,
	readProductListCache,
	writeProductListCache,
} from "../lib/product-list-cache.js";
import { parseSorting } from "../lib/sorting.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import {
	getVariantIdentity,
	isValidProductCode,
	normalizeProductCode,
	parseAttributeValues,
	parsePrice,
	parseStock,
	toStoredAttributeValues,
} from "../utils/product-variant.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const PRODUCT_SORTS = new Map([
	["name_asc", [["name", "ASC"]]],
	["name_desc", [["name", "DESC"]]],
	["created_at_asc", [["createdAt", "ASC"]]],
	["created_at_desc", [["createdAt", "DESC"]]],
]);

const {
	Brands,
	Categories,
	CategoryAttributeOptions,
	CategoryAttributes,
	Inventories,
	ProductImageCleanups,
	ProductImages,
	ProductItemAttributeValues,
	ProductItems,
	Products,
	sequelize,
} = db;

// oxlint-disable-next-line unicorn/no-null -- The API represents a missing image explicitly as null.
const EMPTY_IMAGE = null;

const toImageResponse = (image, fallbackAlt) => ({
	alt: image?.alt ?? fallbackAlt,
	url: image?.imageUrl ?? EMPTY_IMAGE,
});

const productIncludes = [
	{
		model: Categories,
		as: "category",
		attributes: ["id", "name", "isActive"],
		include: [
			{
				model: CategoryAttributes,
				as: "attributes",
				attributes: [
					"id",
					"name",
					"value",
					"isRequired",
					"isVariant",
					"sortOrder",
				],
				required: false,
				separate: true,
				order: [["sortOrder", "ASC"]],
				include: [
					{
						model: CategoryAttributeOptions,
						as: "options",
						attributes: ["id", "name", "hex", "sortOrder"],
						required: false,
						separate: true,
						order: [["sortOrder", "ASC"]],
					},
				],
			},
		],
	},
	{
		model: Brands,
		as: "brand",
		attributes: ["id", "name", "isActive"],
	},
	{
		model: ProductItems,
		as: "items",
		attributes: ["id", "productCode", "name", "price", "isActive"],
		required: false,
		separate: true,
		include: [
			{
				model: Inventories,
				as: "inventory",
				attributes: ["stock"],
				required: false,
			},
			{
				model: ProductItemAttributeValues,
				as: "attributeValues",
				attributes: [
					"categoryAttributeId",
					"categoryAttributeOptionId",
					"value",
				],
				required: false,
				include: [
					{
						model: CategoryAttributes,
						as: "attribute",
						attributes: [
							"id",
							"name",
							"value",
							"isRequired",
							"isVariant",
							"sortOrder",
						],
						required: true,
					},
				],
			},
		],
		order: [["name", "ASC"]],
	},
];

const productListIncludes = [
	...productIncludes,
	{
		model: ProductImages,
		as: "images",
		attributes: ["imageUrl", "alt", "isPrimary", "sortOrder"],
		required: false,
		separate: true,
		order: [
			["isPrimary", "DESC"],
			["sortOrder", "ASC"],
		],
	},
];

async function getCategory(categoryId) {
	const category = await Categories.findByPk(categoryId, {
		include: [
			{
				model: CategoryAttributes,
				as: "attributes",
				required: false,
				separate: true,
				order: [["sortOrder", "ASC"]],
				include: [
					{
						model: CategoryAttributeOptions,
						as: "options",
						required: false,
						separate: true,
						order: [["sortOrder", "ASC"]],
					},
				],
			},
		],
	});

	if (!category) {
		throw createHttpError(
			constants.HTTP_STATUS_NOT_FOUND,
			"Category not found",
		);
	}

	if (!category.isActive) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Category is inactive",
		);
	}

	return category;
}

const parseItems = (value, category, productName) => {
	if (value === undefined) return [];
	let items = value;
	if (typeof items === "string") {
		try {
			items = JSON.parse(items);
		} catch {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"items must be a valid JSON array",
			);
		}
	}
	if (!Array.isArray(items)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"items must be an array",
		);
	}

	const productCodes = new Set();
	const variantSignatures = new Set();
	return items.map((item, index) => {
		const productCode = normalizeProductCode(item?.productCode);
		const price = parsePrice(item?.price);
		const stock = item?.stock === undefined ? 0 : parseStock(item.stock);
		if (!isValidProductCode(productCode)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].productCode must contain only uppercase letters, numbers, or hyphens`,
			);
		}
		if (productCodes.has(productCode)) {
			throw createHttpError(
				constants.HTTP_STATUS_CONFLICT,
				`Duplicate product code in items: ${productCode}`,
			);
		}
		productCodes.add(productCode);
		if (!price) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].price must be a positive number with a maximum of 2 decimal places`,
			);
		}
		if (stock === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].stock must be a non-negative integer`,
			);
		}
		if (item?.isActive !== undefined && typeof item.isActive !== "boolean") {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`items[${index}].isActive must be a boolean`,
			);
		}

		const attributes = parseAttributeValues(
			item?.attributes,
			category.attributes,
		);
		const variant = getVariantIdentity(attributes);
		if (variant.signature && variantSignatures.has(variant.signature)) {
			throw createHttpError(
				constants.HTTP_STATUS_CONFLICT,
				`Duplicate product variant combination at items[${index}]`,
			);
		}
		if (variant.signature) variantSignatures.add(variant.signature);

		return {
			productCode,
			name: variant.name || normalizeText(item?.name) || productName,
			variantSignature: variant.signature,
			price,
			stock,
			isActive: item?.isActive ?? true,
			attributes,
		};
	});
};

const createItems = async (items, productId, transaction) => {
	for (const item of items) {
		const createdItem = await ProductItems.create(
			{
				productId,
				productCode: item.productCode,
				name: item.name,
				variantSignature: item.variantSignature,
				price: item.price,
				isActive: item.isActive,
			},
			{ transaction },
		);
		await Inventories.create(
			{ productItemId: createdItem.id, stock: item.stock },
			{ transaction },
		);
		if (item.attributes.length > 0) {
			await ProductItemAttributeValues.bulkCreate(
				toStoredAttributeValues(item.attributes, createdItem.id),
				{ transaction },
			);
		}
	}
};

const toProductResponse = (product) => {
	const value =
		typeof product?.toJSON === "function" ? product.toJSON() : product;

	const { images, ...productData } = value;
	const primaryProductImage =
		images?.find((image) => image.isPrimary) ?? images?.[0];
	const items = Array.isArray(value?.items)
		? value.items.map(
				({ attributeValues, images: _images, inventory, ...item }) => {
					return {
						...item,
						...(attributeValues
							? { attributes: toItemAttributes(attributeValues) }
							: {}),
						image: toImageResponse(primaryProductImage, value.name),
						stock: inventory?.stock ?? 0,
					};
				},
			)
		: [];

	return {
		...productData,
		image: toImageResponse(primaryProductImage, value.name),
		stock: items.reduce((total, item) => total + Number(item.stock), 0),
		items,
	};
};

const toProductCrudResponse = (product) => {
	const value =
		typeof product?.toJSON === "function" ? product.toJSON() : product;
	const items = Array.isArray(value?.items)
		? value.items.map(({ attributeValues, inventory, ...item }) => ({
				...item,
				...(attributeValues
					? { attributes: toItemAttributes(attributeValues) }
					: {}),
				stock: inventory?.stock ?? 0,
			}))
		: [];

	return {
		...value,
		stock: items.reduce((total, item) => total + Number(item.stock), 0),
		items,
	};
};

const toItemAttributes = (attributeValues) =>
	(attributeValues ?? [])
		.map((entry) => ({
			id: entry.attribute?.id ?? entry.categoryAttributeId,
			name: entry.attribute?.name,
			value: entry.value,
			optionId: entry.categoryAttributeOptionId,
			isRequired: entry.attribute?.isRequired,
			isVariant: entry.attribute?.isVariant,
			sortOrder: entry.attribute?.sortOrder,
		}))
		.toSorted((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

async function getBrand(brandId) {
	const brand = await Brands.findByPk(brandId);

	if (!brand) {
		throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "Brand not found");
	}

	if (!brand.isActive) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Brand is inactive",
		);
	}

	return brand;
}

const parseActiveField = (value) => {
	if (value === undefined) return;
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;
	throw createHttpError(
		constants.HTTP_STATUS_BAD_REQUEST,
		"isActive must be true or false",
	);
};

const uploadImage = async (buffer) => {
	try {
		return await uploadCloudinaryImage(buffer);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		throw createHttpError(
			constants.HTTP_STATUS_BAD_GATEWAY,
			`Cloudinary upload failed: ${message}`,
		);
	}
};

const enqueueImageCleanup = (publicId, transaction) => {
	if (!publicId) return;
	return ProductImageCleanups.findOrCreate({
		where: { publicId },
		defaults: { publicId },
		transaction,
	});
};

const deleteQueuedImage = async (publicId) => {
	if (!publicId) return true;
	try {
		const result = await deleteCloudinaryImage(publicId);
		if (result?.result !== "ok" && result?.result !== "not found") {
			throw new Error("Cloudinary did not confirm image deletion");
		}
		await ProductImageCleanups.destroy({ where: { publicId } });
		return true;
	} catch (error) {
		console.error("Failed to delete Cloudinary product image", error);
		return false;
	}
};

const cleanupFailedUpload = async (publicId) => {
	try {
		await enqueueImageCleanup(publicId);
	} catch (error) {
		console.error("Could not queue cleanup of failed product upload", error);
	}
	await deleteQueuedImage(publicId);
};

export async function getProducts(req, res, next) {
	try {
		const search = parseSearch(req.query.search);
		const categoryId =
			typeof req.query.categoryId === "string"
				? req.query.categoryId.trim()
				: "";
		const brandId =
			typeof req.query.brandId === "string" ? req.query.brandId.trim() : "";
		const isActive = parseBoolean(req.query.isActive);
		const { sort, order } = parseSorting(req.query, {
			defaultSort: "name_asc",
			options: PRODUCT_SORTS,
			message:
				"sort must be name_asc, name_desc, created_at_asc, or created_at_desc",
		});

		if (req.query.isActive !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be true or false",
			);
		}

		if (categoryId && !isUuid(categoryId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"categoryId must be a valid UUID",
			);
		}

		if (brandId && !isUuid(brandId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"brandId must be a valid UUID",
			);
		}
		const { page, limit } = parsePagination(req.query);
		const cacheKey = await productListCacheKey({
			search,
			categoryId,
			brandId,
			isActive,
			sort,
			page,
			limit,
		});
		const cached = await readProductListCache(cacheKey);
		if (cached) return res.status(constants.HTTP_STATUS_OK).json(cached);

		const where = {};

		if (search) {
			where.name = {
				[Op.iLike]: `%${search}%`,
			};
		}

		if (categoryId) where.categoryId = categoryId;
		if (brandId) where.brandId = brandId;
		if (isActive !== undefined) where.isActive = isActive;

		const { rows, pagination } = await paginate(Products, req.query, {
			where,
			include: productListIncludes,
			order,
			distinct: true,
		});

		const body = {
			success: true,
			message: "Products retrieved successfully",
			data: rows.map((row) => toProductResponse(row)),
			meta: { pagination },
		};
		await writeProductListCache(cacheKey, body);
		return res.status(constants.HTTP_STATUS_OK).json(body);
	} catch (error) {
		return next(error);
	}
}

export async function getProductById(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product id must be a valid UUID",
			);
		}

		const product = await Products.findByPk(req.params.id, {
			include: productListIncludes,
		});

		if (!product) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product not found",
			);
		}

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product retrieved successfully",
			data: toProductResponse(product),
		});
	} catch (error) {
		return next(error);
	}
}

export async function createProduct(req, res, next) {
	let uploadedImage;
	try {
		const name = normalizeText(req.body?.name);
		const { categoryId, brandId } = req.body ?? {};
		const description = req.body?.description;
		const isActive = parseActiveField(req.body?.isActive);

		if (!name) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product name is required",
			);
		}

		if (!isUuid(categoryId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"categoryId must be a valid UUID",
			);
		}

		if (!isUuid(brandId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"brandId must be a valid UUID",
			);
		}

		if (
			description !== undefined &&
			description !== null &&
			typeof description !== "string"
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"description must be a string",
			);
		}

		const [category] = await Promise.all([
			getCategory(categoryId),
			getBrand(brandId),
		]);
		const items = parseItems(req.body?.items, category, name);

		const productData = {
			categoryId,
			brandId,
			name,
			// oxlint-disable-next-line unicorn/no-null -- Empty descriptions are stored as SQL NULL.
			description: description?.trim() || null,
			isActive: isActive ?? true,
		};
		let product;
		if (req.file) uploadedImage = await uploadImage(req.file.buffer);
		if (uploadedImage || items.length > 0) {
			product = await sequelize.transaction(async (transaction) => {
				const created = await Products.create(productData, { transaction });
				if (uploadedImage) {
					await ProductImages.create(
						{
							productId: created.id,
							imageUrl: uploadedImage.url,
							publicId: uploadedImage.publicId,
							alt: name,
							isPrimary: true,
							sortOrder: 0,
						},
						{ transaction },
					);
				}
				await createItems(items, created.id, transaction);
				return created;
			});
		} else {
			product = await Products.create(productData);
		}
		const storedImage = uploadedImage;
		uploadedImage = undefined;

		const createdProduct = await Products.findByPk(product.id, {
			include: productIncludes,
		});
		const data = toProductCrudResponse(createdProduct);
		if (storedImage) {
			data.image = { alt: name, url: storedImage.url };
		}

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Product created successfully",
			data,
		});
	} catch (error) {
		if (uploadedImage) await cleanupFailedUpload(uploadedImage.publicId);
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Product code or variant combination already exists",
				),
			);
		}
		return next(error);
	}
}

export async function updateProduct(req, res, next) {
	let uploadedImage;
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product id must be a valid UUID",
			);
		}

		const product = await Products.findByPk(req.params.id);

		if (!product) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product not found",
			);
		}

		const updates = {};

		if (Object.hasOwn(req.body ?? {}, "name")) {
			const name = normalizeText(req.body.name);

			if (!name) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"Product name cannot be empty",
				);
			}

			updates.name = name;
		}

		if (Object.hasOwn(req.body ?? {}, "description")) {
			const { description } = req.body;

			if (description !== null && typeof description !== "string") {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"description must be a string or null",
				);
			}

			// oxlint-disable-next-line unicorn/no-null -- Sending null explicitly clears the database value.
			updates.description = description?.trim() || null;
		}

		if (Object.hasOwn(req.body ?? {}, "categoryId")) {
			if (!isUuid(req.body.categoryId)) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"categoryId must be a valid UUID",
				);
			}

			await getCategory(req.body.categoryId);
			if (req.body.categoryId !== product.categoryId) {
				const itemCount = await ProductItems.count({
					where: { productId: product.id },
				});
				if (itemCount > 0) {
					throw createHttpError(
						constants.HTTP_STATUS_CONFLICT,
						"Product category cannot be changed while product items still exist",
					);
				}
			}
			updates.categoryId = req.body.categoryId;
		}

		if (Object.hasOwn(req.body ?? {}, "brandId")) {
			if (!isUuid(req.body.brandId)) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"brandId must be a valid UUID",
				);
			}

			await getBrand(req.body.brandId);
			updates.brandId = req.body.brandId;
		}

		if (Object.hasOwn(req.body ?? {}, "isActive")) {
			if (req.body.isActive === undefined) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"isActive must be true or false",
				);
			}
			updates.isActive = parseActiveField(req.body.isActive);
		}

		if (Object.keys(updates).length === 0 && !req.file) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		const imageAlt = updates.name ?? product.name;
		let previousPublicId;
		if (req.file) {
			uploadedImage = await uploadImage(req.file.buffer);
			await sequelize.transaction(async (transaction) => {
				if (Object.keys(updates).length > 0) {
					await product.update(updates, { transaction });
				}
				const primaryImage = await ProductImages.findOne({
					where: {
						productId: product.id,
						isPrimary: true,
					},
					transaction,
				});
				if (primaryImage) {
					previousPublicId = primaryImage.publicId;
					await enqueueImageCleanup(previousPublicId, transaction);
					await primaryImage.update(
						{
							imageUrl: uploadedImage.url,
							publicId: uploadedImage.publicId,
							alt: imageAlt,
						},
						{ transaction },
					);
				} else {
					await ProductImages.create(
						{
							productId: product.id,
							imageUrl: uploadedImage.url,
							publicId: uploadedImage.publicId,
							alt: imageAlt,
							isPrimary: true,
							sortOrder: 0,
						},
						{ transaction },
					);
				}
			});
		} else if (updates.name) {
			await sequelize.transaction(async (transaction) => {
				await product.update(updates, { transaction });
				await ProductImages.update(
					{ alt: imageAlt },
					{
						where: {
							productId: product.id,
							isPrimary: true,
						},
						transaction,
					},
				);
			});
		} else {
			await product.update(updates);
		}
		const storedImage = uploadedImage;
		uploadedImage = undefined;
		const cleanupPending = previousPublicId
			? !(await deleteQueuedImage(previousPublicId))
			: false;

		const updatedProduct = await Products.findByPk(product.id, {
			include: productIncludes,
		});
		const data = toProductCrudResponse(updatedProduct);
		if (storedImage) data.image = { alt: imageAlt, url: storedImage.url };

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product updated successfully",
			data,
			...(storedImage ? { cleanupPending } : {}),
		});
	} catch (error) {
		if (uploadedImage) await cleanupFailedUpload(uploadedImage.publicId);
		return next(error);
	}
}

export async function deleteProduct(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product id must be a valid UUID",
			);
		}

		const product = await Products.findByPk(req.params.id);

		if (!product) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product not found",
			);
		}

		await product.destroy();

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
}
