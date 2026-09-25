/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { getInventoryMovements } from "../controllers/inventory-movement.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

/**
 * @openapi
 * /api/v1/inventory-movements:
 *   get:
 *     tags: [Inventory Movements]
 *     summary: Retrieve inventory movement history
 *     description: Retrieves stock movement logs, newest first. Checkout movements include their transaction; manual adjustments do not.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search product code, product name, or variant name.
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [addition, reduction, correction] }
 *       - in: query
 *         name: product_item_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, example: 2026-09-01 }
 *         description: Include movements on and after this date.
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, example: 2026-09-30 }
 *         description: Include movements through this date.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at_desc, created_at_asc, quantity_asc, quantity_desc]
 *           default: created_at_desc
 *         description: Sort the list using a supported field and direction.
 *     responses:
 *       200:
 *         description: Inventory movements retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data, meta]
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Inventory movements retrieved successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, product_item, type, quantity, stock_before, stock_after, note, source, transaction, performed_by, created_at]
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       product_item:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           product_code: { type: string, example: SAM-A55-128-NVY }
 *                           product_name: { type: string, example: Galaxy A55 }
 *                           variant_name: { type: string, example: 8GB/128GB - Awesome Navy }
 *                       type: { type: string, enum: [addition, reduction, correction] }
 *                       quantity: { type: integer, example: 10 }
 *                       stock_before: { type: integer, example: 5 }
 *                       stock_after: { type: integer, example: 15 }
 *                       note: { type: string, nullable: true, example: Barang masuk dari supplier }
 *                       source: { type: string, enum: [checkout, manual_adjustment] }
 *                       transaction:
 *                         nullable: true
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           transaction_number: { type: string, example: TRX-20260916-AB12CD34 }
 *                       performed_by:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           fullname: { type: string, example: Admin One }
 *                       created_at: { type: string, format: date-time }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 20 }
 *                         total_items: { type: integer, example: 1 }
 *                         total_pages: { type: integer, example: 1 }
 *       400:
 *         description: Invalid filter or pagination query.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: Admin permission is required.
 */
router.get("/", getInventoryMovements);

export default router;
