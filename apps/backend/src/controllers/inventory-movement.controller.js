import { constants } from "node:http2";

import { Op } from "sequelize";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid } from "../utils/validation.js";

const { InventoryMovements, ProductItems, Products, Transactions, Users } = db;
const MOVEMENT_TYPES = new Set(["addition", "reduction", "correction"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toPlain = (value) =>
	typeof value?.toJSON === "function" ? value.toJSON() : value;

const parseDate = (value, field) => {
	if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			`${field} must use YYYY-MM-DD format`,
		);
	}

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			`${field} must use YYYY-MM-DD format`,
		);
	}

	return date;
};

const toInventoryMovementResponse = (record) => {
	const movement = toPlain(record);
	const transaction = movement.transaction;

	return {
		id: movement.id,
		product_item: {
			id: movement.productItem.id,
			product_code: movement.productItem.productCode,
			product_name: movement.productItem.product.name,
			variant_name: movement.productItem.name,
		},
		type: movement.type,
		quantity: movement.quantity,
		stock_before: movement.stockBefore,
		stock_after: movement.stockAfter,
		note: movement.note,
		source: movement.transactionId ? "checkout" : "manual_adjustment",
		transaction: transaction
			? {
					id: transaction.id,
					transaction_number: transaction.transactionNumber,
				}
			: null,
		performed_by: {
			id: movement.user.id,
			fullname: movement.user.fullname,
		},
		created_at: movement.createdAt,
	};
};

export async function getInventoryMovements(request, response, next) {
	try {
		const { type, product_item_id: productItemId, from, to } = request.query;

		if (type !== undefined && !MOVEMENT_TYPES.has(type)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"type must be addition, reduction, or correction",
			);
		}

		if (productItemId !== undefined && !isUuid(productItemId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"product_item_id must be a valid UUID",
			);
		}

		const fromDate = from === undefined ? undefined : parseDate(from, "from");
		const toDate = to === undefined ? undefined : parseDate(to, "to");

		if (fromDate && toDate && fromDate > toDate) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"from must not be greater than to",
			);
		}

		/** @type {Record<string | symbol, unknown>} */
		const where = {
			...(type ? { type } : {}),
			...(productItemId ? { productItemId } : {}),
		};

		if (fromDate || toDate) {
			where.createdAt = {
				...(fromDate ? { [Op.gte]: fromDate } : {}),
				...(toDate ? { [Op.lt]: new Date(toDate.getTime() + 86_400_000) } : {}),
			};
		}

		const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
		if (q) {
			where[Op.or] = [
				{ "$productItem.productCode$": { [Op.iLike]: `%${q}%` } },
				{ "$productItem.name$": { [Op.iLike]: `%${q}%` } },
				{ "$productItem.product.name$": { [Op.iLike]: `%${q}%` } },
			];
		}

		const { rows, pagination } = await paginate(
			InventoryMovements,
			request.query,
			{
				where,
				attributes: [
					"id",
					"productItemId",
					"transactionId",
					"type",
					"quantity",
					"stockBefore",
					"stockAfter",
					"note",
					"createdAt",
				],
				include: [
					{
						model: ProductItems,
						as: "productItem",
						attributes: ["id", "productCode", "name"],
						required: true,
						include: [
							{
								model: Products,
								as: "product",
								attributes: ["id", "name"],
								required: true,
							},
						],
					},
					{
						model: Users,
						as: "user",
						attributes: ["id", "fullname"],
						required: true,
					},
					{
						model: Transactions,
						as: "transaction",
						attributes: ["id", "transactionNumber"],
						required: false,
					},
				],
				order: [["createdAt", "DESC"]],
				distinct: true,
				subQuery: false,
			},
		);

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Inventory movements retrieved successfully",
			data: rows.map((row) => toInventoryMovementResponse(row)),
			meta: { pagination },
		});
	} catch (error) {
		return next(error);
	}
}
