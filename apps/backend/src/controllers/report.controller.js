// @ts-nocheck
// oxlint-disable unicorn/no-null
import { constants } from "node:http2";

import { QueryTypes } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SALES_PERIODS = new Set(["day", "week", "month", "year"]);

export function parseReportFilters(query) {
	const parseDate = (value, field) => {
		if (value === undefined) return null;
		if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
			throw createHttpError(400, `${field} must use YYYY-MM-DD format`);
		}
		const [year, month, day] = value.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		if (date.toISOString().slice(0, 10) !== value) {
			throw createHttpError(400, `${field} must use YYYY-MM-DD format`);
		}
		return date;
	};

	const from = parseDate(query.from, "from");
	const to = parseDate(query.to, "to");
	if (from && to && from > to) {
		throw createHttpError(400, "from must not be greater than to");
	}
	const page = query.page === undefined ? 1 : Number(query.page);
	const limit = query.limit === undefined ? 20 : Number(query.limit);
	if (
		!Number.isSafeInteger(page) ||
		page < 1 ||
		!Number.isSafeInteger(limit) ||
		limit < 1 ||
		limit > 100
	) {
		throw createHttpError(
			400,
			"page must be positive and limit must be between 1 and 100",
		);
	}
	return {
		from: from?.toISOString().slice(0, 10) ?? null,
		toExclusive: to
			? new Date(to.getTime() + 86_400_000).toISOString().slice(0, 10)
			: null,
		limit,
		offset: (page - 1) * limit,
		page,
	};
}

const queryRows = (sql, replacements) =>
	db.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
const period = (alias) =>
	`(:from IS NULL OR ${alias}.created_at >= (CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'))
	AND (:toExclusive IS NULL OR ${alias}.created_at < (CAST(:toExclusive AS timestamp) AT TIME ZONE 'Asia/Jakarta'))`;
const pagination = (page, limit, total) => ({
	page,
	limit,
	total_items: Number(total),
	total_pages: Math.ceil(Number(total) / limit),
});
const respond = (response, data, meta) =>
	response.status(constants.HTTP_STATUS_OK).json({
		success: true,
		message: "Report retrieved successfully",
		data,
		meta,
	});

export async function getCustomerReport(request, response, next) {
	try {
		const filters = parseReportFilters(request.query);
		const txWhere = `t.status = 'completed' AND ${period("t")}`;
		const [summary] = await queryRows(
			`
			SELECT COUNT(*)::int AS transactions,
				COUNT(*) FILTER (WHERE customer_id IS NOT NULL)::int AS member_transactions,
				COUNT(*) FILTER (WHERE customer_id IS NULL)::int AS non_member_transactions,
				COUNT(DISTINCT customer_id)::int AS active_members,
				COALESCE(SUM(t.subtotal), 0)::text AS gross_sales,
				COALESCE(SUM(t.discount_amount), 0)::text AS discount_amount,
				COALESCE(SUM(t.tax_amount), 0)::text AS tax_amount,
				COALESCE(SUM(t.total_amount), 0)::text AS total_sales,
				COALESCE(SUM(t.total_amount) FILTER (WHERE customer_id IS NULL), 0)::text AS non_member_total_sales
			FROM transactions t WHERE ${txWhere}`,
			filters,
		);
		const [count] = await queryRows(
			`
			SELECT COUNT(DISTINCT t.customer_id)::int AS total
			FROM transactions t WHERE ${txWhere} AND t.customer_id IS NOT NULL`,
			filters,
		);
		const members = await queryRows(
			`
			WITH filtered AS (
				SELECT t.id, t.customer_id, t.total_amount, t.created_at
				FROM transactions t WHERE ${txWhere} AND t.customer_id IS NOT NULL
			), ranked AS (
				SELECT customer_id, COUNT(*)::int AS transaction_count,
					SUM(total_amount)::text AS total_spent, MAX(created_at) AS last_transaction_at
				FROM filtered GROUP BY customer_id
				ORDER BY COUNT(*) DESC, MAX(created_at) DESC, customer_id
				LIMIT :limit OFFSET :offset
			)
			SELECT c.id, c.name, c.phone, r.transaction_count, r.total_spent, r.last_transaction_at,
				COALESCE((SELECT json_agg(json_build_object(
					'product_item_id', d.product_item_id, 'product_name', d.product_name,
					'product_code', d.product_code, 'quantity', d.qty, 'subtotal', d.subtotal
				) ORDER BY d.product_name)
				FROM (SELECT td.product_item_id, MAX(td.product_name) AS product_name,
					MAX(td.product_code) AS product_code, SUM(td.qty)::int AS qty,
					SUM(td.subtotal)::text AS subtotal
					FROM filtered f JOIN transaction_details td ON td.transaction_id = f.id
					WHERE f.customer_id = r.customer_id GROUP BY td.product_item_id) d), '[]'::json) AS products
			FROM ranked r JOIN customers c ON c.id = r.customer_id
			ORDER BY r.transaction_count DESC, r.last_transaction_at DESC, c.id`,
			filters,
		);
		const nonMemberProducts = await queryRows(
			`
			SELECT td.product_item_id, MAX(td.product_name) AS product_name,
				MAX(td.product_code) AS product_code, SUM(td.qty)::int AS quantity,
				SUM(td.subtotal)::text AS subtotal
			FROM transactions t JOIN transaction_details td ON td.transaction_id = t.id
			WHERE ${txWhere} AND t.customer_id IS NULL
			GROUP BY td.product_item_id ORDER BY quantity DESC, subtotal DESC`,
			filters,
		);
		return respond(
			response,
			{
				timezone: "Asia/Jakarta",
				summary: {
					...summary,
					// Keep the original fields for existing report clients.
					revenue: summary.total_sales,
					non_member_revenue: summary.non_member_total_sales,
				},
				members,
				non_member_products: nonMemberProducts,
			},
			// @ts-ignore
			{ pagination: pagination(filters.page, filters.limit, count.total) },
		);
	} catch (error) {
		return next(error);
	}
}

const itemStatsSql = () => `
	WITH sales AS (
		SELECT td.product_item_id, COUNT(DISTINCT t.id)::int AS transaction_count,
			SUM(td.qty)::int AS units_sold, SUM(td.subtotal)::text AS gross_sales
		FROM transaction_details td JOIN transactions t ON t.id = td.transaction_id
		WHERE t.status = 'completed' AND ${period("t")}
		GROUP BY td.product_item_id
	), movements AS (
		SELECT m.product_item_id,
			COALESCE(SUM(GREATEST(m.stock_after - m.stock_before, 0)), 0)::int AS stock_in,
			COALESCE(SUM(GREATEST(m.stock_before - m.stock_after, 0)), 0)::int AS stock_out,
			COUNT(*) FILTER (WHERE m.type = 'correction')::int AS corrections
		FROM inventory_movements m WHERE ${period("m")}
		GROUP BY m.product_item_id
	)
	SELECT pi.id AS product_item_id, pi.product_code, pi.name AS variant_name,
		p.id AS product_id, p.name AS product_name, COALESCE(i.stock, 0)::int AS current_stock,
		COALESCE(s.transaction_count, 0)::int AS transaction_count,
		COALESCE(s.units_sold, 0)::int AS units_sold,
		COALESCE(s.gross_sales, '0') AS gross_sales,
		COALESCE(m.stock_in, 0)::int AS stock_in,
		COALESCE(m.stock_out, 0)::int AS stock_out,
		COALESCE(m.corrections, 0)::int AS corrections
	FROM product_items pi JOIN products p ON p.id = pi.product_id
	LEFT JOIN inventories i ON i.product_item_id = pi.id
	LEFT JOIN sales s ON s.product_item_id = pi.id
	LEFT JOIN movements m ON m.product_item_id = pi.id`;

async function getItemReport(request, response, next, kind) {
	try {
		const filters = parseReportFilters(request.query);
		const order =
			kind === "products"
				? "units_sold DESC, product_name, variant_name"
				: "current_stock ASC, product_name, variant_name";
		const sql = itemStatsSql();
		const [count] = await queryRows(
			`SELECT COUNT(*)::int AS total FROM (${sql}) report`,
			filters,
		);
		const [summary] = await queryRows(
			`SELECT COUNT(*)::int AS variants,
			COALESCE(SUM(current_stock), 0)::int AS current_stock,
			COALESCE(SUM(units_sold), 0)::int AS units_sold,
			COALESCE(SUM(gross_sales::numeric), 0)::text AS gross_sales,
			COALESCE(SUM(stock_in), 0)::int AS stock_in,
			COALESCE(SUM(stock_out), 0)::int AS stock_out,
			COALESCE(SUM(corrections), 0)::int AS corrections
			FROM (${sql}) report`,
			filters,
		);
		const items = await queryRows(
			`SELECT * FROM (${sql}) report ORDER BY ${order}, product_item_id LIMIT :limit OFFSET :offset`,
			filters,
		);
		const data = {
			timezone: "Asia/Jakarta",
			summary: { ...summary, revenue: summary.gross_sales },
			items: items.map((item) => ({ ...item, revenue: item.gross_sales })),
		};
		if (kind === "products") {
			data.transactions = await queryRows(
				`
				SELECT t.id, td.id AS detail_id, t.transaction_number, t.created_at, t.customer_id,
					c.name AS customer_name, td.product_item_id, td.product_name,
					td.product_code, td.qty, td.subtotal::text AS subtotal
				FROM transactions t JOIN transaction_details td ON td.transaction_id = t.id
				LEFT JOIN customers c ON c.id = t.customer_id
				WHERE t.status = 'completed' AND ${period("t")}
				ORDER BY t.created_at DESC, td.id DESC LIMIT 30`,
				filters,
			);
		}
		if (kind === "inventory") {
			data.movements = await queryRows(
				`
				SELECT m.id, m.created_at, m.type, m.quantity, m.stock_before, m.stock_after,
					m.note, pi.product_code, pi.name AS variant_name, p.name AS product_name,
					t.transaction_number, u.fullname AS performed_by
				FROM inventory_movements m JOIN product_items pi ON pi.id = m.product_item_id
				JOIN products p ON p.id = pi.product_id
				LEFT JOIN transactions t ON t.id = m.transaction_id
				JOIN users u ON u.id = m.user_id
				WHERE ${period("m")}
				ORDER BY m.created_at DESC, m.id DESC LIMIT 30`,
				filters,
			);
		}
		return respond(response, data, {
			// @ts-ignore
			pagination: pagination(filters.page, filters.limit, count.total),
		});
	} catch (error) {
		return next(error);
	}
}

export const getProductReport = (request, response, next) =>
	getItemReport(request, response, next, "products");
export const getInventoryReport = (request, response, next) =>
	getItemReport(request, response, next, "inventory");

export async function getSalesReport(request, response, next) {
	try {
		const filters = parseReportFilters(request.query);
		const salesPeriod = request.query.period ?? "day";
		if (!SALES_PERIODS.has(salesPeriod)) {
			throw createHttpError(400, "period must be day, week, month, or year");
		}

		// PostgreSQL weeks start on Monday. All reports use the same Jakarta date bounds.
		const salesWhere = `t.status = 'completed' AND ${period("t")}`;
		const bucket = `date_trunc('${salesPeriod}', t.created_at AT TIME ZONE 'Asia/Jakarta')`;
		const [summary] = await queryRows(
			`SELECT COUNT(*)::int AS transaction_count,
				COALESCE(SUM(t.subtotal), 0)::text AS gross_sales,
				COALESCE(SUM(t.discount_amount), 0)::text AS discount_amount,
				COALESCE(SUM(t.tax_amount), 0)::text AS tax_amount,
				COALESCE(SUM(t.total_amount), 0)::text AS total_sales,
				COALESCE(ROUND(AVG(t.total_amount), 2), 0)::text AS average_transaction
			FROM transactions t WHERE ${salesWhere}`,
			filters,
		);
		const grouped = `SELECT ${bucket} AS period_start,
			COUNT(*)::int AS transaction_count,
			SUM(t.subtotal)::text AS gross_sales,
			SUM(t.discount_amount)::text AS discount_amount,
			SUM(t.tax_amount)::text AS tax_amount,
			SUM(t.total_amount)::text AS total_sales,
			ROUND(AVG(t.total_amount), 2)::text AS average_transaction
			FROM transactions t WHERE ${salesWhere} GROUP BY 1`;
		const [count] = await queryRows(
			`SELECT COUNT(*)::int AS total FROM (${grouped}) periods`,
			filters,
		);
		const rows = await queryRows(
			`SELECT TO_CHAR(period_start, 'YYYY-MM-DD') AS period_start,
				transaction_count, gross_sales, discount_amount, tax_amount,
				total_sales, average_transaction
			FROM (${grouped}) periods
			ORDER BY period_start DESC LIMIT :limit OFFSET :offset`,
			filters,
		);
		return respond(
			response,
			{ period: salesPeriod, timezone: "Asia/Jakarta", summary, rows },
			{
				// @ts-ignore
				pagination: pagination(filters.page, filters.limit, count.total),
			},
		);
	} catch (error) {
		return next(error);
	}
}

const completedTransactions = `t.status = 'completed' AND ${period("t")}`;

async function getPaymentReconciliation(filters) {
	const [summary] = await queryRows(
		`SELECT COUNT(t.id)::int AS transaction_count,
			COUNT(p.id)::int AS paid_transaction_count,
			(COUNT(t.id) - COUNT(p.id))::int AS missing_payment_count,
			COALESCE(SUM(t.subtotal), 0)::text AS gross_sales,
			COALESCE(SUM(t.discount_amount), 0)::text AS discount_amount,
			COALESCE(SUM(t.tax_amount), 0)::text AS tax_amount,
			COALESCE(SUM(t.total_amount), 0)::text AS total_sales,
			COALESCE(SUM(p.amount), 0)::text AS collected_amount,
			(COALESCE(SUM(t.total_amount), 0) - COALESCE(SUM(p.amount), 0))::text AS payment_gap
		FROM transactions t
		LEFT JOIN payments p ON p.transaction_id = t.id AND p.status = 'paid'
		WHERE ${completedTransactions}`,
		filters,
	);
	return summary;
}

export async function getPaymentMethodReport(request, response, next) {
	try {
		const filters = parseReportFilters(request.query);
		const summary = await getPaymentReconciliation(filters);
		const [count] = await queryRows(
			"SELECT COUNT(*)::int AS total FROM payment_methods",
			filters,
		);
		const rows = await queryRows(
			`WITH paid_sales AS (
				SELECT p.payment_method_id, p.amount, p.paid_amount, p.change_amount,
					t.id AS transaction_id, t.created_at, t.subtotal,
					t.discount_amount, t.tax_amount, t.total_amount
				FROM payments p JOIN transactions t ON t.id = p.transaction_id
				WHERE p.status = 'paid' AND ${completedTransactions}
			)
			SELECT pm.id AS payment_method_id, pm.code, pm.name, pm.type, pm.is_active,
				COUNT(s.transaction_id)::int AS transaction_count,
				COALESCE(SUM(s.subtotal), 0)::text AS gross_sales,
				COALESCE(SUM(s.discount_amount), 0)::text AS discount_amount,
				COALESCE(SUM(s.tax_amount), 0)::text AS tax_amount,
				COALESCE(SUM(s.total_amount), 0)::text AS total_sales,
				COALESCE(SUM(s.amount), 0)::text AS collected_amount,
				COALESCE(SUM(s.paid_amount) FILTER (WHERE pm.type = 'cash'), 0)::text AS cash_tendered,
				COALESCE(SUM(s.change_amount) FILTER (WHERE pm.type = 'cash'), 0)::text AS change_given,
				(COALESCE(SUM(s.total_amount), 0) - COALESCE(SUM(s.amount), 0))::text AS payment_gap,
				MAX(s.created_at) AS last_transaction_at
			FROM payment_methods pm
			LEFT JOIN paid_sales s ON s.payment_method_id = pm.id
			GROUP BY pm.id
			ORDER BY COALESCE(SUM(s.amount), 0) DESC, pm.name, pm.id
			LIMIT :limit OFFSET :offset`,
			filters,
		);
		return respond(
			response,
			{ timezone: "Asia/Jakarta", summary, methods: rows },
			{ pagination: pagination(filters.page, filters.limit, count.total) },
		);
	} catch (error) {
		return next(error);
	}
}

export async function getCashierReport(request, response, next) {
	try {
		const filters = parseReportFilters(request.query);
		const summary = await getPaymentReconciliation(filters);
		const [count] = await queryRows(
			`SELECT COUNT(DISTINCT t.user_id)::int AS total
			FROM transactions t WHERE ${completedTransactions}`,
			filters,
		);
		const rows = await queryRows(
			`SELECT u.id AS cashier_id, u.fullname, u.username, r.name AS role,
				COUNT(t.id)::int AS transaction_count,
				COUNT(t.id) FILTER (WHERE t.customer_id IS NOT NULL)::int AS member_transactions,
				COUNT(t.id) FILTER (WHERE t.customer_id IS NULL)::int AS non_member_transactions,
				COUNT(p.id)::int AS paid_transaction_count,
				COALESCE(SUM(t.subtotal), 0)::text AS gross_sales,
				COALESCE(SUM(t.discount_amount), 0)::text AS discount_amount,
				COALESCE(SUM(t.tax_amount), 0)::text AS tax_amount,
				COALESCE(SUM(t.total_amount), 0)::text AS total_sales,
				COALESCE(ROUND(AVG(t.total_amount), 2), 0)::text AS average_transaction,
				COALESCE(SUM(p.amount), 0)::text AS collected_amount,
				(COALESCE(SUM(t.total_amount), 0) - COALESCE(SUM(p.amount), 0))::text AS payment_gap,
				MAX(t.created_at) AS last_transaction_at
			FROM transactions t
			JOIN users u ON u.id = t.user_id
			JOIN roles r ON r.id = u.role_id
			LEFT JOIN payments p ON p.transaction_id = t.id AND p.status = 'paid'
			WHERE ${completedTransactions}
			GROUP BY u.id, r.id
			ORDER BY SUM(t.total_amount) DESC, u.fullname, u.id
			LIMIT :limit OFFSET :offset`,
			filters,
		);
		return respond(
			response,
			{ timezone: "Asia/Jakarta", summary, cashiers: rows },
			{ pagination: pagination(filters.page, filters.limit, count.total) },
		);
	} catch (error) {
		return next(error);
	}
}
