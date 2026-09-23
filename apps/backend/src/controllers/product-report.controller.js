// @ts-nocheck
import { QueryTypes } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid } from "../utils/validation.js";
import { parseReportFilters } from "./report.controller.js";

const VIEWS = new Set(["transactions", "customers", "cashiers"]);
const queryRows = (sql, replacements) =>
	db.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

const productJoins = `
	FROM transactions t
	JOIN transaction_details td ON td.transaction_id = t.id
	JOIN product_items pi ON pi.id = td.product_item_id`;
const productWhere = `
	WHERE t.status = 'completed' AND pi.product_id = :productId
		AND (:from IS NULL OR t.created_at >= (CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'))
		AND (:toExclusive IS NULL OR t.created_at < (CAST(:toExclusive AS timestamp) AT TIME ZONE 'Asia/Jakarta'))`;

const views = {
	transactions: {
		count: `SELECT COUNT(DISTINCT t.id)::int AS total ${productJoins} ${productWhere}`,
		rows: `SELECT t.id AS transaction_id, t.transaction_number, t.created_at,
			t.customer_id, c.name AS customer_name, c.phone AS customer_phone,
			t.user_id AS cashier_id, u.fullname AS cashier_name,
			SUM(td.qty)::int AS quantity, SUM(td.subtotal)::text AS gross_sales
			${productJoins}
			LEFT JOIN customers c ON c.id = t.customer_id
			JOIN users u ON u.id = t.user_id
			${productWhere}
			GROUP BY t.id, c.id, u.id
			ORDER BY t.created_at DESC, t.id DESC LIMIT :limit OFFSET :offset`,
	},
	customers: {
		count: `SELECT COUNT(*)::int AS total FROM (
			SELECT t.customer_id ${productJoins} ${productWhere} GROUP BY t.customer_id
		) customers`,
		rows: `SELECT t.customer_id, c.name AS customer_name, c.phone AS customer_phone,
			COUNT(DISTINCT t.id)::int AS transaction_count,
			SUM(td.qty)::int AS units_sold, SUM(td.subtotal)::text AS gross_sales,
			MAX(t.created_at) AS last_transaction_at
			${productJoins}
			LEFT JOIN customers c ON c.id = t.customer_id
			${productWhere}
			GROUP BY t.customer_id, c.id
			ORDER BY SUM(td.subtotal) DESC, t.customer_id NULLS LAST
			LIMIT :limit OFFSET :offset`,
	},
	cashiers: {
		count: `SELECT COUNT(DISTINCT t.user_id)::int AS total ${productJoins} ${productWhere}`,
		rows: `SELECT t.user_id AS cashier_id, u.fullname AS cashier_name,
			u.username AS cashier_username,
			COUNT(DISTINCT t.id)::int AS transaction_count,
			SUM(td.qty)::int AS units_sold, SUM(td.subtotal)::text AS gross_sales,
			MAX(t.created_at) AS last_transaction_at
			${productJoins}
			JOIN users u ON u.id = t.user_id
			${productWhere}
			GROUP BY t.user_id, u.id
			ORDER BY SUM(td.subtotal) DESC, t.user_id
			LIMIT :limit OFFSET :offset`,
	},
};

export async function getProductDetailReport(request, response, next) {
	try {
		const productId = request.params.productId;
		if (!isUuid(productId)) {
			throw createHttpError(400, "Product id must be a valid UUID");
		}
		const filters = parseReportFilters(request.query);
		const view = request.query.view ?? "transactions";
		if (!VIEWS.has(view)) {
			throw createHttpError(
				400,
				"view must be transactions, customers, or cashiers",
			);
		}
		const replacements = { ...filters, productId };
		const [product] = await queryRows(
			`SELECT id, name, description, is_active
			FROM products WHERE id = :productId AND deleted_at IS NULL`,
			replacements,
		);
		if (!product) throw createHttpError(404, "Product not found");

		const [summary] = await queryRows(
			`SELECT COUNT(DISTINCT t.id)::int AS transaction_count,
				COUNT(DISTINCT t.id) FILTER (WHERE t.customer_id IS NOT NULL)::int AS member_transactions,
				COUNT(DISTINCT t.id) FILTER (WHERE t.customer_id IS NULL)::int AS non_member_transactions,
				COALESCE(SUM(td.qty), 0)::int AS units_sold,
				COALESCE(SUM(td.subtotal), 0)::text AS gross_sales
			${productJoins} ${productWhere}`,
			replacements,
		);
		const config = views[view];
		const [count] = await queryRows(config.count, replacements);
		const rows = await queryRows(config.rows, replacements);
		const total = Number(count.total);
		return response.status(200).json({
			success: true,
			message: "Product report retrieved successfully",
			data: {
				product,
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
