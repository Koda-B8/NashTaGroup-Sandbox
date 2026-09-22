import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import {
	listCacheKey,
	readListCache,
	writeListCache,
} from "../lib/list-cache.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const { Brands, Products } = db;

const validateName = (value, message) => {
	const name = normalizeText(value);

	if (!name) {
		throw createHttpError(constants.HTTP_STATUS_BAD_REQUEST, message);
	}

	if (name.length > 100) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Brand name must not exceed 100 characters",
		);
	}

	return name;
};

export async function getBrands(req, res, next) {
	try {
		const search = parseSearch(req.query.search);
		const isActive = parseBoolean(req.query.isActive);

		if (req.query.isActive !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be true or false",
			);
		}
		const cacheKey = await listCacheKey("brands", { search, isActive });
		const cached = await readListCache(cacheKey);
		if (cached) return res.status(constants.HTTP_STATUS_OK).json(cached);

		const where = {};

		if (search) {
			where.name = {
				[Op.iLike]: `%${search}%`,
			};
		}

		if (isActive !== undefined) where.isActive = isActive;

		const brands = await Brands.findAll({
			where,
			order: [["name", "ASC"]],
		});

		const body = {
			success: true,
			message: "Brands retrieved successfully",
			data: brands,
		};
		await writeListCache(cacheKey, body);
		return res.status(constants.HTTP_STATUS_OK).json(body);
	} catch (error) {
		return next(error);
	}
}

export async function getBrandById(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Brand id must be a valid UUID",
			);
		}

		const brand = await Brands.findByPk(req.params.id);

		if (!brand) {
			throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "Brand not found");
		}

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Brand retrieved successfully",
			data: brand,
		});
	} catch (error) {
		return next(error);
	}
}

export async function createBrand(req, res, next) {
	try {
		const name = validateName(req.body?.name, "Brand name is required");
		const brand = await Brands.create({ name });

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Brand created successfully",
			data: brand,
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Brand name already exists",
				),
			);
		}

		return next(error);
	}
}

export async function updateBrand(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Brand id must be a valid UUID",
			);
		}

		const body = req.body ?? {};
		const allowedFields = new Set(["name", "is_active"]);
		if (Object.keys(body).some((field) => !allowedFields.has(field))) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Only name and is_active can be updated",
			);
		}

		const updates = {};
		if (Object.hasOwn(body, "name")) {
			updates.name = validateName(body.name, "Brand name cannot be empty");
		}
		if (Object.hasOwn(body, "is_active")) {
			if (typeof body.is_active !== "boolean") {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"is_active must be a boolean",
				);
			}
			updates.isActive = body.is_active;
		}
		if (Object.keys(updates).length === 0) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		const brand = await Brands.findByPk(req.params.id);
		if (!brand) {
			throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "Brand not found");
		}

		await brand.update(updates);

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Brand updated successfully",
			data: brand,
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Brand name already exists",
				),
			);
		}

		return next(error);
	}
}

export async function deleteBrand(req, res, next) {
	try {
		if (!isUuid(req.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Brand id must be a valid UUID",
			);
		}

		const brand = await Brands.findByPk(req.params.id);
		if (!brand) {
			throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "Brand not found");
		}

		const productCount = await Products.count({
			where: { brandId: brand.id },
		});
		if (productCount > 0) {
			throw createHttpError(
				constants.HTTP_STATUS_CONFLICT,
				"Brand cannot be deleted because it is used by products",
			);
		}

		await brand.destroy();

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Brand deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
}
