/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import {
	getTransactionById,
	getTransactions,
} from "../controllers/transaction.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

/**
 * @openapi
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Retrieve transaction history
 *     description: Retrieve paginated transaction history with optional filters.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-(0[1-9]|1[0-2])$'
 *           example: 2026-09
 *         description: Filter transactions by month using YYYY-MM format.
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter transactions by member ID.
 *       - in: query
 *         name: cashier_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter transactions by cashier ID.
 *       - in: query
 *         name: payment_method_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter transactions by payment method ID.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled, refunded]
 *       - in: query
 *         name: member_type
 *         schema:
 *           type: string
 *           enum: [member, non_member]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search transactions by transaction number.
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data, meta]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Transactions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       transaction_number:
 *                         type: string
 *                         example: TRX-20260916-AB12CD34
 *                       status:
 *                         type: string
 *                         example: completed
 *                       total_amount:
 *                         type: string
 *                         example: "5999000.00"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total_items:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *       400:
 *         description: Invalid filter or pagination query
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Only admins can retrieve transactions
 */
router.get("/", getTransactions);

/**
 * @openapi
 * /api/v1/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Retrieve transaction details
 *     description: Retrieve transaction, customer, cashier, item, payment, and summary details.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Transaction retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     transaction_number:
 *                       type: string
 *                       example: TRX-20260916-AB12CD34
 *                     status:
 *                       type: string
 *                       example: completed
 *                     customer:
 *                       nullable: true
 *                       type: object
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_item_id:
 *                             type: string
 *                             format: uuid
 *                           product_name:
 *                             type: string
 *                           product_code:
 *                             type: string
 *                           unit_price:
 *                             type: string
 *                             example: "5999000.00"
 *                           qty:
 *                             type: integer
 *                           subtotal:
 *                             type: string
 *                             example: "5999000.00"
 *                     summary:
 *                       type: object
 *                     payment:
 *                       type: object
 *       400:
 *         description: Invalid transaction ID
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Only admins and cashiers can retrieve transactions
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", getTransactionById);

export default router;
