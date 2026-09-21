/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import { Router } from "express";

import {
	getCustomerReport,
	getInventoryReport,
	getProductReport,
	getSalesReport,
} from "../controllers/report.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = Router();
router.use(authMiddleware, requireRole("admin"));

/**
 * @openapi
 * /api/v1/reports/customers:
 *   get:
 *     tags: [Reports]
 *     summary: Customer and nonmember purchase report
 *     description: Completed transactions only. Members are identified by customer_id. Nonmember purchases are aggregated because they have no customer identity. Date filters use WIB business dates. gross_sales is subtotal before discount and tax; total_sales is the final transaction amount. Legacy revenue and non_member_revenue fields remain as aliases of total_sales and non_member_total_sales.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, description: First transaction date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-01 } }
 *       - { in: query, name: to, description: Last transaction date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-30 } }
 *       - { in: query, name: page, description: Page of members, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, description: Members per page, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: "Member totals, purchased products, and nonmember totals" }
 *       400: { description: Invalid date or pagination }
 *       401: { description: Authentication required }
 *       403: { description: Admin role required }
 */
router.get("/customers", getCustomerReport);

/**
 * @openapi
 * /api/v1/reports/products:
 *   get:
 *     tags: [Reports]
 *     summary: Sales and stock movement report by product variant
 *     description: Sales include completed transactions only. gross_sales is item subtotal before transaction discounts and tax; legacy revenue is its alias. Date filters use WIB business dates; current_stock is the latest stock.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, description: First transaction and movement date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-01 } }
 *       - { in: query, name: to, description: Last transaction and movement date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-30 } }
 *       - { in: query, name: page, description: Page of product variants, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, description: Product variants per page, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: Product totals and latest completed transaction items }
 *       400: { description: Invalid date or pagination }
 *       401: { description: Authentication required }
 *       403: { description: Admin role required }
 */
router.get("/products", getProductReport);

/**
 * @openapi
 * /api/v1/reports/inventory:
 *   get:
 *     tags: [Reports]
 *     summary: Current stock and period movement report
 *     description: Stock-in and stock-out are actual stock changes, including corrections. Date filters use WIB business dates; current_stock is the latest stock. gross_sales is item subtotal before discounts and tax; legacy revenue is its alias.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, description: First movement date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-01 } }
 *       - { in: query, name: to, description: Last movement date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-30 } }
 *       - { in: query, name: page, description: Page of product variants, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, description: Product variants per page, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: Inventory totals and latest movement history }
 *       400: { description: Invalid date or pagination }
 *       401: { description: Authentication required }
 *       403: { description: Admin role required }
 */
router.get("/inventory", getInventoryReport);

/**
 * @openapi
 * /api/v1/reports/sales:
 *   get:
 *     tags: [Reports]
 *     summary: Sales totals grouped by day, week, month, or year
 *     description: Completed transactions only. gross_sales is subtotal before discounts and tax; total_sales is the final transaction amount. Dates and period boundaries use Asia/Jakarta time; weeks start on Monday.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: period, description: Aggregation interval, schema: { type: string, enum: [day, week, month, year], default: day } }
 *       - { in: query, name: from, description: First local business date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-01 } }
 *       - { in: query, name: to, description: Last local business date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-30 } }
 *       - { in: query, name: page, description: Page of periods, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, description: Periods per page, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: Sales summary and paginated period totals }
 *       400: { description: Invalid period, date, or pagination }
 *       401: { description: Authentication required }
 *       403: { description: Admin role required }
 */
router.get("/sales", getSalesReport);

export default router;
