/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import { Router } from "express";

import {
	getCashierReport,
	getCustomerReport,
	getInventoryReport,
	getPaymentMethodReport,
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

/**
 * @openapi
 * /api/v1/reports/payment-methods:
 *   get:
 *     tags: [Reports]
 *     summary: Sales and payments by payment method
 *     description: Completed transactions with paid payments are grouped by method, including inactive methods and methods with no sales. collected_amount uses payments.amount (the sale amount); cash_tendered and change_given show cash received and returned. The summary also counts completed transactions without a paid payment and shows payment_gap as total_sales minus collected_amount. Date filters use WIB business dates.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, description: First transaction date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-01 } }
 *       - { in: query, name: to, description: Last transaction date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-30 } }
 *       - { in: query, name: page, description: Page of payment methods, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, description: Payment methods per page, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200:
 *         description: Reconciliation summary and paginated payment method totals
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Report retrieved successfully
 *               data:
 *                 timezone: Asia/Jakarta
 *                 summary: { transaction_count: 3, paid_transaction_count: 2, missing_payment_count: 1, gross_sales: "150000.00", discount_amount: "0.00", tax_amount: "0.00", total_sales: "150000.00", collected_amount: "100000.00", payment_gap: "50000.00" }
 *                 methods:
 *                   - { payment_method_id: "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0", code: CASH, name: Cash, type: cash, is_active: true, transaction_count: 2, gross_sales: "100000.00", discount_amount: "0.00", tax_amount: "0.00", total_sales: "100000.00", collected_amount: "100000.00", cash_tendered: "120000.00", change_given: "20000.00", payment_gap: "0.00", last_transaction_at: "2026-09-22T03:00:00.000Z" }
 *               meta:
 *                 pagination: { page: 1, limit: 20, total_items: 1, total_pages: 1 }
 *       400: { description: Invalid date or pagination }
 *       401: { description: Authentication required }
 *       403: { description: Admin role required }
 */
router.get("/payment-methods", getPaymentMethodReport);

/**
 * @openapi
 * /api/v1/reports/cashiers:
 *   get:
 *     tags: [Reports]
 *     summary: Sales and collected payments by cashier
 *     description: Completed transactions are grouped by the user who checked out, including admins who acted as cashiers. Member and nonmember counts, sales totals, paid transaction count, collected_amount, and payment_gap are provided per user. The summary also counts completed transactions without a paid payment. Date filters use WIB business dates.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, description: First transaction date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-01 } }
 *       - { in: query, name: to, description: Last transaction date inclusive in WIB, schema: { type: string, format: date, example: 2026-09-30 } }
 *       - { in: query, name: page, description: Page of cashiers, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, description: Cashiers per page, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200:
 *         description: Reconciliation summary and paginated cashier totals
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Report retrieved successfully
 *               data:
 *                 timezone: Asia/Jakarta
 *                 summary: { transaction_count: 3, paid_transaction_count: 2, missing_payment_count: 1, gross_sales: "150000.00", discount_amount: "0.00", tax_amount: "0.00", total_sales: "150000.00", collected_amount: "100000.00", payment_gap: "50000.00" }
 *                 cashiers:
 *                   - { cashier_id: "91fa60c8-0e62-42d3-99ad-c4e585e9fc30", fullname: Kasir Satu, username: kasir1, role: cashier, transaction_count: 3, member_transactions: 2, non_member_transactions: 1, paid_transaction_count: 2, gross_sales: "150000.00", discount_amount: "0.00", tax_amount: "0.00", total_sales: "150000.00", average_transaction: "50000.00", collected_amount: "100000.00", payment_gap: "50000.00", last_transaction_at: "2026-09-22T03:00:00.000Z" }
 *               meta:
 *                 pagination: { page: 1, limit: 20, total_items: 1, total_pages: 1 }
 *       400: { description: Invalid date or pagination }
 *       401: { description: Authentication required }
 *       403: { description: Admin role required }
 */
router.get("/cashiers", getCashierReport);

export default router;
