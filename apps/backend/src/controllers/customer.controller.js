import { constants } from "node:http2";

import { Op } from "sequelize";

import {
	listCacheKey,
	readListCache,
	writeListCache,
} from "../lib/list-cache.js";
import { paginate, parsePagination } from "../lib/pagination.js";
import { parseSorting } from "../lib/sorting.js";
import db from "../models/index.cjs";
import { parseSearch } from "../utils/query.js";

const { Customers } = db;
const CUSTOMER_SORTS = new Map([
	["created_at_desc", [["createdAt", "DESC"]]],
	["created_at_asc", [["createdAt", "ASC"]]],
	["name_asc", [["name", "ASC"]]],
	["name_desc", [["name", "DESC"]]],
]);

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
		const { sort, order } = parseSorting(request.query, {
			defaultSort: "created_at_desc",
			options: CUSTOMER_SORTS,
			message:
				"sort must be created_at_desc, created_at_asc, name_asc, or name_desc",
		});
		const cacheKey = await listCacheKey("customers", {
			search,
			sort,
			page,
			limit,
		});
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
			order,
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
