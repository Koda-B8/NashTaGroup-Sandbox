/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { checkout } from "../controllers/checkout.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/checkout:
 *   post:
 *     tags: [Checkout]
 *     summary: Complete a checkout transaction
 *     description: >
 *       Creates a transaction, payment, transaction details, stock reductions,
 *       and inventory movements atomically. The server calculates all prices
 *       and totals from current database values.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: >
 *           A UUID generated once per checkout attempt. Reusing the key with
 *           the same payload returns the existing transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payment_method_id, paid_amount, items]
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *                 description: Existing member ID. Cannot be sent with customer.
 *               customer:
 *                 type: object
 *                 description: New member data. Cannot be sent with customer_id.
 *                 required: [phone]
 *                 properties:
 *                   name:
 *                     type: string
 *                     nullable: true
 *                     example: Budi
 *                   phone:
 *                     type: string
 *                     example: "08123456789"
 *               payment_method_id:
 *                 type: string
 *                 format: uuid
 *               paid_amount:
 *                 type: string
 *                 example: "6000000.00"
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [product_item_id, qty]
 *                   properties:
 *                     product_item_id:
 *                       type: string
 *                       format: uuid
 *                     qty:
 *                       type: integer
 *                       minimum: 1
 *           examples:
 *             nonMember:
 *               summary: Non-member checkout
 *               value:
 *                 payment_method_id: dfda501e-21ba-4dda-af16-9f843fa29d59
 *                 paid_amount: "6000000.00"
 *                 items:
 *                   - product_item_id: d7878d58-7742-4389-9c35-92d72351f200
 *                     qty: 1
 *             existingMember:
 *               summary: Existing member checkout
 *               value:
 *                 customer_id: 2f13fc74-ec91-4a88-959d-aed84de60132
 *                 payment_method_id: dfda501e-21ba-4dda-af16-9f843fa29d59
 *                 paid_amount: "6000000.00"
 *                 items:
 *                   - product_item_id: d7878d58-7742-4389-9c35-92d72351f200
 *                     qty: 1
 *             newMember:
 *               summary: New member checkout
 *               value:
 *                 customer:
 *                   name: Budi
 *                   phone: "08123456789"
 *                 payment_method_id: dfda501e-21ba-4dda-af16-9f843fa29d59
 *                 paid_amount: "6000000.00"
 *                 items:
 *                   - product_item_id: d7878d58-7742-4389-9c35-92d72351f200
 *                     qty: 1
 *     responses:
 *       200:
 *         description: Existing transaction returned for the same idempotency key and payload
 *       201:
 *         description: Transaction completed successfully
 *       400:
 *         description: Invalid checkout payload or insufficient cash payment
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Only admins and cashiers can complete checkout
 *       404:
 *         description: Customer, payment method, product item, product, or inventory not found
 *       409:
 *         description: Insufficient stock, duplicate customer phone, or idempotency conflict
 */
router.post("/", requireRole("admin", "cashier"), checkout);

export default router;
