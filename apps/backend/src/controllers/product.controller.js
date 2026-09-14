// oxlint-disable unicorn/no-null
import { constants } from "node:http2";

import { Op } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean } from "../utils/query.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const {
	Brands,
	Categories,
	Inventories,
	ProductImages,
	ProductItems,
	Products,
} = db;

// oxlint-disable-next-line unicorn/no-null -- The API represents a missing image explicitly as null.
const EMPTY_IMAGE = null;

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
					image:
						primaryItemImage?.imageUrl ??
						primaryProductImage?.imageUrl ??
						EMPTY_IMAGE,
					alt: primaryItemImage?.alt ?? primaryProductImage?.alt ?? item.name,
					stock: inventory?.stock ?? 0,
				};
			})
		: [];

	return {
		...productData,
		image: primaryProductImage?.imageUrl ?? EMPTY_IMAGE,
		alt: primaryProductImage?.alt ?? value.name,
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

export async function getProducts(req, res, next) {
	try {
		const search =
			typeof req.query.search === "string" ? req.query.search.trim() : "";
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
			include: productIncludes,
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
			data: toProductCrudResponse(product),
		});
	} catch (error) {
		return next(error);
	}
}

export async function createProduct(req, res, next) {
	try {
		const name = normalizeText(req.body?.name);
		const { categoryId, brandId } = req.body ?? {};
		const description = req.body?.description;

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

		if (
			Object.hasOwn(req.body ?? {}, "isActive") &&
			typeof req.body.isActive !== "boolean"
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be a boolean",
			);
		}

		await Promise.all([getCategory(categoryId), getBrand(brandId)]);

		const product = await Products.create({
			categoryId,
			brandId,
			name,
			// oxlint-disable-next-line unicorn/no-null -- Empty descriptions are stored as SQL NULL.
			description: description?.trim() || null,
			isActive: req.body?.isActive ?? true,
		});

		const createdProduct = await Products.findByPk(product.id, {
			include: productIncludes,
		});

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Product created successfully",
			data: toProductCrudResponse(createdProduct),
		});
	} catch (error) {
		return next(error);
	}
}

export async function updateProduct(req, res, next) {
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

		await product.update(updates);

		const updatedProduct = await Products.findByPk(product.id, {
			include: productIncludes,
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product updated successfully",
			data: toProductCrudResponse(updatedProduct),
		});
	} catch (error) {
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
