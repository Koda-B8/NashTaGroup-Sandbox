import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import db from "../models/index.cjs";

const { Categories } = db;

class HttpError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

const createHttpError = (statusCode, message) =>
	new HttpError(statusCode, message);

const normalizeName = (value) => {
	if (typeof value !== "string") return "";

	return value.trim().replaceAll(/\s+/g, " ");
};

const parseBoolean = (value) => {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;

	return;
};

export async function getCategories(req, res, next) {
	try {
		const search =
			typeof req.query.search === "string" ? req.query.search.trim() : "";
		const isActive = parseBoolean(req.query.isActive);

		if (req.query.isActive !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be true or false",
			);
		}

		const where = {};

		if (search) {
			Object.assign(where, {
				name: {
					[Op.iLike]: `%${search}%`,
				},
			});
		}

		if (isActive !== undefined) {
			Object.assign(where, { isActive });
		}

		const categories = await Categories.findAll({
			where,
			order: [["name", "ASC"]],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Categories retrieved successfully",
			data: categories,
		});
	} catch (error) {
		return next(error);
	}
}

export async function getCategoryById(req, res, next) {
	try {
		const category = await Categories.findByPk(req.params.id);

		if (!category) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Category not found",
			);
		}

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Category retrieved successfully",
			data: category,
		});
	} catch (error) {
		return next(error);
	}
}

export async function createCategory(req, res, next) {
	try {
		const name = normalizeName(req.body?.name);

		if (!name) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Category name is required",
			);
		}

		const category = await Categories.create({ name });

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Category created successfully",
			data: category,
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Category name already exists",
				),
			);
		}

		return next(error);
	}
}

export async function updateCategory(req, res, next) {
	try {
		const category = await Categories.findByPk(req.params.id);

		if (!category) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Category not found",
			);
		}

		const updates = {};

		if (Object.hasOwn(req.body ?? {}, "name")) {
			const name = normalizeName(req.body.name);

			if (!name) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"Category name cannot be empty",
				);
			}

			Object.assign(updates, { name });
		}

		if (Object.hasOwn(req.body ?? {}, "isActive")) {
			if (typeof req.body.isActive !== "boolean") {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"isActive must be a boolean",
				);
			}

			Object.assign(updates, { isActive: req.body.isActive });
		}

		if (Object.keys(updates).length === 0) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		await category.update(updates);

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Category updated successfully",
			data: category,
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Category name already exists",
				),
			);
		}

		return next(error);
	}
}

export async function deleteCategory(req, res, next) {
	try {
		const category = await Categories.findByPk(req.params.id);

		if (!category) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Category not found",
			);
		}

		await category.destroy();

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Category deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
}
