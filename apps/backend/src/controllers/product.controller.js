// oxlint-disable unicorn/no-null
import { constants } from "node:http2";

import { Op } from "sequelize";

import {
	deleteProductImage as deleteCloudinaryImage,
	uploadProductImage as uploadCloudinaryImage,
} from "../lib/cloudinary.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const {
	Brands,
	Categories,
	Inventories,
	ProductImageCleanups,
	ProductImages,
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
		],
		order: [["name", "ASC"]],
	},
];

const productListIncludes = [
	...productIncludes.map((include) => {
		if (include.as !== "items") return include;

		return {
			...include,
			include: [
				{
					model: Inventories,
					as: "inventory",
					attributes: ["stock"],
					required: false,
				},
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
			],
		};
	}),
	{
		model: ProductImages,
		as: "images",
		attributes: ["imageUrl", "alt", "isPrimary", "sortOrder"],
		where: { productItemId: null },
		required: false,
		separate: true,
		order: [
			["isPrimary", "DESC"],
			["sortOrder", "ASC"],
		],
	},
];

async function getCategory(categoryId) {
	const category = await Categories.findByPk(categoryId);

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

const toProductResponse = (product) => {
	const value =
		typeof product?.toJSON === "function" ? product.toJSON() : product;

	const { images, ...productData } = value;
	const primaryProductImage =
		images?.find((image) => image.isPrimary) ?? images?.[0];
	const items = Array.isArray(value?.items)
		? value.items.map(({ images, inventory, ...item }) => {
				const primaryItemImage =
					images?.find((image) => image.isPrimary) ?? images?.[0];

				return {
					...item,
					image: toImageResponse(
						primaryItemImage ?? primaryProductImage,
						item.name,
					),
					stock: inventory?.stock ?? 0,
				};
			})
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
		? value.items.map(({ inventory, ...item }) => ({
				...item,
				stock: inventory?.stock ?? 0,
			}))
		: [];

	return {
		...value,
		stock: items.reduce((total, item) => total + Number(item.stock), 0),
		items,
	};
};

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

		const where = {};

		if (search) {
			where.name = {
				[Op.iLike]: `%${search}%`,
			};
		}

		if (categoryId) where.categoryId = categoryId;
		if (brandId) where.brandId = brandId;
		if (isActive !== undefined) where.isActive = isActive;

		const products = await Products.findAll({
			where,
			include: productListIncludes,
			order: [["name", "ASC"]],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Products retrieved successfully",
			data: products.map((product) => toProductResponse(product)),
		});
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

		await Promise.all([getCategory(categoryId), getBrand(brandId)]);

		const productData = {
			categoryId,
			brandId,
			name,
			// oxlint-disable-next-line unicorn/no-null -- Empty descriptions are stored as SQL NULL.
			description: description?.trim() || null,
			isActive: isActive ?? true,
		};
		let product;
		if (req.file) {
			uploadedImage = await uploadImage(req.file.buffer);
			product = await sequelize.transaction(async (transaction) => {
				const created = await Products.create(productData, { transaction });
				await ProductImages.create(
					{
						productId: created.id,
						productItemId: null,
						imageUrl: uploadedImage.url,
						publicId: uploadedImage.publicId,
						alt: name,
						isPrimary: true,
						sortOrder: 0,
					},
					{ transaction },
				);
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
						productItemId: null,
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
							productItemId: null,
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
							productItemId: null,
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
