// oxlint-disable unicorn/no-null -- The API and image queries intentionally represent missing values as SQL/JSON null.
import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

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

const {
	Brands,
	Categories,
	CategoryAttributeOptions,
	CategoryAttributes,
	Inventories,
	ProductImages,
	ProductItemAttributeValues,
	ProductItems,
	Products,
	sequelize,
} = db;
const EMPTY_IMAGE_URL = null;

const attributeValueInclude = {
	model: ProductItemAttributeValues,
	as: "attributeValues",
	attributes: [
		"id",
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
		{
			model: CategoryAttributeOptions,
			as: "option",
			attributes: ["id", "name", "hex"],
			required: true,
		},
	],
};

const itemIncludes = [
	{
		model: Products,
		as: "product",
		attributes: ["id", "name", "categoryId", "brandId", "isActive"],
		required: true,
	},
	{
		model: Inventories,
		as: "inventory",
		attributes: ["stock"],
		required: false,
	},
	attributeValueInclude,
];

const productItemListIncludes = [
	{
		model: Products,
		as: "product",
		attributes: ["id", "name", "categoryId", "brandId", "isActive"],
		required: true,
		include: [
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
		],
	},
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
	attributeValueInclude,
];

const productItemDetailIncludes = [
	{
		model: Products,
		as: "product",
		attributes: [
			"id",
			"name",
			"description",
			"categoryId",
			"brandId",
			"isActive",
		],
		required: true,
		include: [
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
		],
	},
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
	attributeValueInclude,
];

const findPrimaryImage = (images) =>
	images?.find((image) => image.isPrimary) ?? images?.[0];

const toImageResponse = (image, fallbackAlt) => ({
	alt: image?.alt ?? fallbackAlt,
	url: image?.imageUrl ?? EMPTY_IMAGE_URL,
});

const getProductItemAlt = (productName, itemName) => {
	const normalizedProductName = productName?.trim();
	const normalizedItemName = itemName?.trim() ?? "";

	if (
		!normalizedProductName ||
		normalizedItemName
			.toLowerCase()
			.startsWith(normalizedProductName.toLowerCase())
	) {
		return normalizedItemName;
	}

	return `${normalizedProductName} ${normalizedItemName}`.trim();
};

const toAttributeResponse = (attributeValues) =>
	(attributeValues ?? [])
		.map((entry) => ({
			id: entry.attribute?.id ?? entry.categoryAttributeId,
			name: entry.attribute?.name,
			value: entry.value,
			optionId: entry.option?.id ?? entry.categoryAttributeOptionId,
			isRequired: entry.attribute?.isRequired,
			isVariant: entry.attribute?.isVariant,
			sortOrder: entry.attribute?.sortOrder,
		}))
		.toSorted((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

const toProductItemResponse = (productItem) => {
	const value =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const {
		attributeValues,
		inventory,
		variantSignature: _variantSignature,
		...data
	} = value;

	return {
		...data,
		stock: inventory?.stock ?? 0,
		...(attributeValues
			? { attributes: toAttributeResponse(attributeValues) }
			: {}),
	};
};

const toProductItemListResponse = (productItem) => {
	const value =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const {
		attributeValues,
		images,
		inventory,
		product,
		variantSignature: _variantSignature,
		...data
	} = value;
	const { images: productImages, ...productData } = product ?? {};
	const itemImage = findPrimaryImage(images);
	const productImage = findPrimaryImage(productImages);
	const image = itemImage ?? productImage;

	return {
		...data,
		product: product ? productData : undefined,
		stock: inventory?.stock ?? 0,
		...(attributeValues
			? { attributes: toAttributeResponse(attributeValues) }
			: {}),
		image: toImageResponse(image, getProductItemAlt(product?.name, value.name)),
	};
};

const toProductItemDetailResponse = (productItem) => {
	const value =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const {
		attributeValues,
		images,
		inventory,
		product,
		variantSignature: _variantSignature,
		...itemData
	} = value;
	const { images: productImages, ...productData } = product ?? {};
	const itemImage = findPrimaryImage(images);
	const productImage = findPrimaryImage(productImages);
	const image = itemImage ?? productImage;

	return {
		...itemData,
		stock: inventory?.stock ?? 0,
		...(attributeValues
			? { attributes: toAttributeResponse(attributeValues) }
			: {}),
		image: toImageResponse(image, getProductItemAlt(product?.name, value.name)),
		product: product
			? {
					...productData,
					image: toImageResponse(productImage, product.name),
				}
			: undefined,
	};
};

async function getProduct(productId) {
	const product = await Products.findByPk(productId, {
		include: [
			{
				model: Categories,
				as: "category",
				attributes: ["id", "name"],
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
		],
	});

	if (!product) {
		throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "Product not found");
	}

	if (!product.isActive) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Product is inactive",
		);
	}

	return product;
}

const ensureUniqueVariant = async (
	productId,
	variantSignature,
	excludedProductItemId,
) => {
	if (!variantSignature) return;
	const where = { productId, variantSignature };
	if (excludedProductItemId) where.id = { [Op.ne]: excludedProductItemId };
	const duplicate = await ProductItems.findOne({ where, attributes: ["id"] });
	if (duplicate) {
		throw createHttpError(
			constants.HTTP_STATUS_CONFLICT,
			"Product variant combination already exists",
		);
	}
};

export async function getProductItems(req, res, next) {
	try {
		const search = parseSearch(req.query.search);
		const productId =
			typeof req.query.productId === "string" ? req.query.productId.trim() : "";
		const isActive = parseBoolean(req.query.isActive);

		if (req.query.isActive !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be true or false",
			);
		}

		if (productId && !isUuid(productId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"productId must be a valid UUID",
			);
		}

		const where = {};

		if (search) {
			where[Op.or] = [
				{
					name: {
						[Op.iLike]: `%${search}%`,
					},
				},
				{
					productCode: {
						[Op.iLike]: `%${search}%`,
					},
				},
			];
		}

		if (productId) where.productId = productId;
		if (isActive !== undefined) where.isActive = isActive;

		const productItems = await ProductItems.findAll({
			where,
			include: productItemListIncludes,
			order: [["name", "ASC"]],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product items retrieved successfully",
			data: productItems.map((item) => toProductItemListResponse(item)),
		});
	} catch (error) {
		return next(error);
	}
}

export async function getProductItemById(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product item id must be a valid UUID",
			);
		}

		const productItem = await ProductItems.findByPk(req.params.id, {
			include: productItemDetailIncludes,
		});

		if (!productItem) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product item not found",
			);
		}

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product item retrieved successfully",
			data: toProductItemDetailResponse(productItem),
		});
	} catch (error) {
		return next(error);
	}
}

export async function createProductItem(req, res, next) {
	try {
		const { productId } = req.body ?? {};
		const requestedName = normalizeText(req.body?.name);
		const productCode = normalizeProductCode(req.body?.productCode);
		const price = parsePrice(req.body?.price);
		const stock =
			req.body?.stock === undefined ? 0 : parseStock(req.body.stock);

		if (!isUuid(productId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"productId must be a valid UUID",
			);
		}

		if (!isValidProductCode(productCode)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"productCode must contain only uppercase letters, numbers, or hyphens",
			);
		}

		if (!price) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"price must be a positive number with a maximum of 2 decimal places",
			);
		}

		if (stock === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"stock must be a non-negative integer",
			);
		}

		if (
			Object.hasOwn(req.body ?? {}, "isActive") &&
			typeof req.body.isActive !== "boolean"
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be a boolean",
			);
		}

		const product = await getProduct(productId);
		const attributes = parseAttributeValues(
			req.body?.attributes,
			product.category?.attributes,
		);
		const variant = getVariantIdentity(attributes);
		const name = variant.name || requestedName || product.name;
		await ensureUniqueVariant(productId, variant.signature);

		const productItem = await sequelize.transaction(async (transaction) => {
			const item = await ProductItems.create(
				{
					productId,
					name,
					productCode,
					variantSignature: variant.signature,
					price,
					isActive: req.body?.isActive ?? true,
				},
				{ transaction },
			);

			await Inventories.create(
				{ productItemId: item.id, stock },
				{ transaction },
			);
			if (attributes.length > 0) {
				await ProductItemAttributeValues.bulkCreate(
					toStoredAttributeValues(attributes, item.id),
					{ transaction },
				);
			}

			return item;
		});

		const createdProductItem = await ProductItems.findByPk(productItem.id, {
			include: itemIncludes,
		});

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Product item created successfully",
			data: toProductItemResponse(createdProductItem),
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			const isVariantConflict =
				error.parent?.constraint ===
					"product_items_product_variant_signature_unique" ||
				Object.hasOwn(error.fields ?? {}, "variant_signature");
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					isVariantConflict
						? "Product variant combination already exists"
						: "Product code already exists",
				),
			);
		}

		return next(error);
	}
}

export async function updateProductItem(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product item id must be a valid UUID",
			);
		}

		const productItem = await ProductItems.findByPk(req.params.id);

		if (!productItem) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product item not found",
			);
		}

		const updates = {};
		let targetProduct;

		if (Object.hasOwn(req.body ?? {}, "productId")) {
			if (!isUuid(req.body.productId)) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"productId must be a valid UUID",
				);
			}

			targetProduct = await getProduct(req.body.productId);
			updates.productId = req.body.productId;
		}

		if (Object.hasOwn(req.body ?? {}, "name")) {
			const name = normalizeText(req.body.name);

			if (!name) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"Product item name cannot be empty",
				);
			}

			updates.name = name;
		}

		if (Object.hasOwn(req.body ?? {}, "productCode")) {
			const productCode = normalizeProductCode(req.body.productCode);

			if (!isValidProductCode(productCode)) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"productCode must contain only uppercase letters, numbers, or hyphens",
				);
			}

			updates.productCode = productCode;
		}

		if (Object.hasOwn(req.body ?? {}, "price")) {
			const price = parsePrice(req.body.price);

			if (!price) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"price must be a positive number with a maximum of 2 decimal places",
				);
			}

			updates.price = price;
		}

		if (Object.hasOwn(req.body ?? {}, "isActive")) {
			if (typeof req.body.isActive !== "boolean") {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"isActive must be a boolean",
				);
			}

			updates.isActive = req.body.isActive;
		}

		const replacesAttributes =
			Object.hasOwn(req.body ?? {}, "attributes") ||
			targetProduct !== undefined;
		let attributes;
		if (replacesAttributes) {
			targetProduct ??= await getProduct(productItem.productId);
			attributes = parseAttributeValues(
				req.body?.attributes,
				targetProduct.category?.attributes,
			);
			const variant = getVariantIdentity(attributes);
			updates.name =
				variant.name || normalizeText(req.body?.name) || targetProduct.name;
			updates.variantSignature = variant.signature;
			await ensureUniqueVariant(
				targetProduct.id,
				variant.signature,
				productItem.id,
			);
		}

		if (Object.keys(updates).length === 0 && !replacesAttributes) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		if (replacesAttributes) {
			await sequelize.transaction(async (transaction) => {
				if (Object.keys(updates).length > 0) {
					await productItem.update(updates, { transaction });
				}
				await ProductItemAttributeValues.destroy({
					where: { productItemId: productItem.id },
					transaction,
				});
				if (attributes.length > 0) {
					await ProductItemAttributeValues.bulkCreate(
						toStoredAttributeValues(attributes, productItem.id),
						{ transaction },
					);
				}
			});
		} else {
			await productItem.update(updates);
		}

		const updatedProductItem = await ProductItems.findByPk(productItem.id, {
			include: itemIncludes,
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product item updated successfully",
			data: toProductItemResponse(updatedProductItem),
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			const isVariantConflict =
				error.parent?.constraint ===
					"product_items_product_variant_signature_unique" ||
				Object.hasOwn(error.fields ?? {}, "variant_signature");
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					isVariantConflict
						? "Product variant combination already exists"
						: "Product code already exists",
				),
			);
		}

		return next(error);
	}
}

export async function deleteProductItem(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product item id must be a valid UUID",
			);
		}

		const productItem = await ProductItems.findByPk(req.params.id);

		if (!productItem) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product item not found",
			);
		}

		await productItem.destroy();

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product item deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
}
