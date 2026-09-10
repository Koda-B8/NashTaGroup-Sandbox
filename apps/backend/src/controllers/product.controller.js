import { constants } from "node:http2";

import { Op } from "sequelize";

import db from "../models/index.cjs";

const { Brands, Categories, ProductItems, Products } = db;

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class HttpError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

const createHttpError = (statusCode, message) =>
	new HttpError(statusCode, message);

const normalizeText = (value) => {
	if (typeof value !== "string") return "";

	return value.trim().replaceAll(/\s+/g, " ");
};

const parseBoolean = (value) => {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;

	return;
};

const isUuid = (value) => typeof value === "string" && UUID_PATTERN.test(value);

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
		order: [["name", "ASC"]],
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
			include: productIncludes,
			order: [["name", "ASC"]],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Products retrieved successfully",
			data: products,
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
			data: product,
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
			description: description?.trim() || null,
			isActive: req.body?.isActive ?? true,
		});

		const createdProduct = await Products.findByPk(product.id, {
			include: productIncludes,
		});

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Product created successfully",
			data: createdProduct,
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
			data: updatedProduct,
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
