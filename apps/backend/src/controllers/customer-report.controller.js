// @ts-nocheck
import { QueryTypes } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid } from "../utils/validation.js";
import { parseReportFilters } from "./report.controller.js";

const VIEWS = new Set(["transactions", "products", "cashiers"]);
const queryRows = (sql, replacements) =>
	db.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

const customerFrom = `FROM transactions t`;
const customerWhere = `
	WHERE t.status = 'completed' AND t.customer_id = :customerId
		AND (:from IS NULL OR t.created_at >= (CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'))
		AND (:toExclusive IS NULL OR t.created_at < (CAST(:toExclusive AS timestamp) AT TIME ZONE 'Asia/Jakarta'))`;

const views = {
	transactions: {
		count: `SELECT COUNT(*)::int AS total ${customerFrom} ${customerWhere}`,
		rows: `SELECT t.id AS transaction_id, t.transaction_number, t.created_at,
			t.subtotal::text AS gross_sales, t.discount_amount::text AS discount_amount,
			t.tax_amount::text AS tax_amount, t.total_amount::text AS total_sales,
			t.user_id AS cashier_id, u.fullname AS cashier_name,
			pm.name AS payment_method_name
			${customerFrom}
			JOIN users u ON u.id = t.user_id
			LEFT JOIN payments pay ON pay.transaction_id = t.id AND pay.status = 'paid'
			LEFT JOIN payment_methods pm ON pm.id = pay.payment_method_id
			${customerWhere}
			ORDER BY t.created_at DESC, t.id DESC LIMIT :limit OFFSET :offset`,
	},
	products: {
		count: `SELECT COUNT(DISTINCT pi.product_id)::int AS total
			${customerFrom}
			JOIN transaction_details td ON td.transaction_id = t.id
			JOIN product_items pi ON pi.id = td.product_item_id
			${customerWhere}`,
		rows: `SELECT p.id AS product_id, p.name AS product_name,
			COUNT(DISTINCT t.id)::int AS transaction_count,
			SUM(td.qty)::int AS units_bought, SUM(td.subtotal)::text AS gross_sales,
			MAX(t.created_at) AS last_transaction_at
			${customerFrom}
			JOIN transaction_details td ON td.transaction_id = t.id
			JOIN product_items pi ON pi.id = td.product_item_id
			JOIN products p ON p.id = pi.product_id
			${customerWhere}
			GROUP BY p.id
			ORDER BY SUM(td.subtotal) DESC, p.id
			LIMIT :limit OFFSET :offset`,
	},
	cashiers: {
		count: `SELECT COUNT(DISTINCT t.user_id)::int AS total ${customerFrom} ${customerWhere}`,
		rows: `SELECT t.user_id AS cashier_id, u.fullname AS cashier_name,
			u.username AS cashier_username,
			COUNT(t.id)::int AS transaction_count,
			SUM(t.total_amount)::text AS total_sales,
			MAX(t.created_at) AS last_transaction_at
			${customerFrom}
			JOIN users u ON u.id = t.user_id
			${customerWhere}
			GROUP BY t.user_id, u.id
			ORDER BY SUM(t.total_amount) DESC, t.user_id
			LIMIT :limit OFFSET :offset`,
	},
};

export async function getCustomerDetailReport(request, response, next) {
	try {
		const customerId = request.params.customerId;
		if (!isUuid(customerId)) {
			throw createHttpError(400, "Customer id must be a valid UUID");
		}
		const filters = parseReportFilters(request.query);
		const view = request.query.view ?? "transactions";
		if (!VIEWS.has(view)) {
			throw createHttpError(
				400,
				"view must be transactions, products, or cashiers",
			);
		}
		const replacements = { ...filters, customerId };
		const [customer] = await queryRows(
			`SELECT id, name, phone FROM customers
			WHERE id = :customerId AND deleted_at IS NULL`,
			replacements,
		);
		if (!customer) throw createHttpError(404, "Customer not found");

		const [summary] = await queryRows(
			`SELECT COUNT(t.id)::int AS transaction_count,
				COALESCE(SUM(t.subtotal), 0)::text AS gross_sales,
				COALESCE(SUM(t.discount_amount), 0)::text AS discount_amount,
				COALESCE(SUM(t.tax_amount), 0)::text AS tax_amount,
				COALESCE(SUM(t.total_amount), 0)::text AS total_sales,
				COALESCE(ROUND(AVG(t.total_amount), 2), 0)::text AS average_transaction,
				MAX(t.created_at) AS last_transaction_at
			${customerFrom} ${customerWhere}`,
			replacements,
		);
		const config = views[view];
		const [count] = await queryRows(config.count, replacements);
		const rows = await queryRows(config.rows, replacements);
		const total = Number(count.total);
		return response.status(200).json({
			success: true,
			message: "Customer report retrieved successfully",
			data: {
				customer,
				timezone: "Asia/Jakarta",
				summary,
				view,
				[view]: rows,
			},
			meta: {
				pagination: {
					page: filters.page,
					limit: filters.limit,
					total_items: total,
					total_pages: Math.ceil(total / filters.limit),
				},
			},
		});
	} catch (error) {
		return next(error);
	}
}
