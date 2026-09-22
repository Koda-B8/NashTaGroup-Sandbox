import { constants } from "node:http2";

import { Op } from "sequelize";

import {
	listCacheKey,
	readListCache,
	writeListCache,
} from "../lib/list-cache.js";
import { paginate, parsePagination } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { parseSearch } from "../utils/query.js";

const { Customers } = db;

const toCustomerResponse = (customer) => {
	const value =
		typeof customer?.toJSON === "function" ? customer.toJSON() : customer;

	return {
		id: value.id,
		name: value.name,
		phone: value.phone,
		created_at: value.createdAt,
	};
};

export async function getCustomers(request, response, next) {
	try {
		const { page, limit } = parsePagination(request.query);
		const search = parseSearch(request.query.q);
		const cacheKey = await listCacheKey("customers", { search, page, limit });
		const cached = await readListCache(cacheKey);
		if (cached) return response.status(constants.HTTP_STATUS_OK).json(cached);
		const where = {};

		if (search) {
			where[Op.or] = [
				{ name: { [Op.iLike]: `%${search}%` } },
				{ phone: { [Op.iLike]: `%${search}%` } },
			];
		}

		const { rows, pagination } = await paginate(Customers, request.query, {
			where,
			attributes: ["id", "name", "phone", "createdAt"],
			order: [["createdAt", "DESC"]],
		});

		const body = {
			success: true,
			message: "Customers retrieved successfully",
			data: rows.map((customer) => toCustomerResponse(customer)),
			meta: { pagination },
		};
		await writeListCache(cacheKey, body);
		return response.status(constants.HTTP_STATUS_OK).json(body);
	} catch (error) {
		return next(error);
	}
}
