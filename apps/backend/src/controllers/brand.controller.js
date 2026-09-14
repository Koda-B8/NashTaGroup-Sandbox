import { constants } from "node:http2";

import { Op } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid } from "../utils/validation.js";

const { Brands } = db;

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
