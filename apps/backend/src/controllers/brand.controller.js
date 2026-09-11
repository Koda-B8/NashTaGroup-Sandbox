import { constants } from "node:http2";

import { Op } from "sequelize";

import db from "../models/index.cjs";

const { Brands } = db;

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

const parseBoolean = (value) => {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;

	return;
};

const isUuid = (value) => typeof value === "string" && UUID_PATTERN.test(value);

export async function getBrands(req, res, next) {
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
			where.name = {
				[Op.iLike]: `%${search}%`,
			};
		}

		if (isActive !== undefined) where.isActive = isActive;

		const brands = await Brands.findAll({
			where,
			order: [["name", "ASC"]],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Brands retrieved successfully",
			data: brands,
		});
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
