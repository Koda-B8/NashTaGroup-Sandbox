import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const {
	Brands,
	Categories,
	Inventories,
	ProductImages,
	ProductItems,
	Products,
	sequelize,
} = db;
const EMPTY_IMAGE_URL = null;

const normalizeProductCode = (value) => {
	if (typeof value !== "string") return "";

	return value.trim().toUpperCase();
};

const parsePrice = (value) => {
	const rawValue = String(value ?? "").trim();

	if (!/^\d{1,13}(\.\d{1,2})?$/.test(rawValue)) {
		return;
	}

	const price = Number(rawValue);

	if (!Number.isFinite(price) || price <= 0) {
		return;
	}

	return rawValue;
};

const parseStock = (value) => {
	if (!Number.isInteger(value) || value < 0) return;

	return value;
};

const isValidProductCode = (value) => /^[A-Z0-9][A-Z0-9-]{0,49}$/.test(value);

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

const toProductItemResponse = (productItem) => {
	const value =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const { inventory, ...data } = value;

	return {
		...data,
		stock: inventory?.stock ?? 0,
	};
};

const toProductItemListResponse = (productItem) => {
	const value =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const { images, inventory, product, ...data } = value;
	const { images: productImages, ...productData } = product ?? {};
	const itemImage = findPrimaryImage(images);
	const productImage = findPrimaryImage(productImages);
	const image = itemImage ?? productImage;

	return {
		...data,
		product: product ? productData : undefined,
		stock: inventory?.stock ?? 0,
		image: toImageResponse(image, getProductItemAlt(product?.name, value.name)),
	};
};

const toProductItemDetailResponse = (productItem) => {
	const value =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const { images, inventory, product, ...itemData } = value;
	const { images: productImages, ...productData } = product ?? {};
	const itemImage = findPrimaryImage(images);
	const productImage = findPrimaryImage(productImages);
	const image = itemImage ?? productImage;

	return {
		...itemData,
		stock: inventory?.stock ?? 0,
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
	const product = await Products.findByPk(productId);

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
		const name = normalizeText(req.body?.name);
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

		if (!name) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product item name is required",
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

		await getProduct(productId);

		const productItem = await sequelize.transaction(async (transaction) => {
			const item = await ProductItems.create(
				{
					productId,
					name,
					productCode,
					price,
					isActive: req.body?.isActive ?? true,
				},
				{ transaction },
			);

			await Inventories.create(
				{ productItemId: item.id, stock },
				{ transaction },
			);

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
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Product code already exists",
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

		if (Object.hasOwn(req.body ?? {}, "productId")) {
			if (!isUuid(req.body.productId)) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"productId must be a valid UUID",
				);
			}

			await getProduct(req.body.productId);
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

		if (Object.keys(updates).length === 0) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		await productItem.update(updates);

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
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Product code already exists",
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
