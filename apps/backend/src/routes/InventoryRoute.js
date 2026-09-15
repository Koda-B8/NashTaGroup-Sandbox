import express from "express";
/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */

import {
	adjustStock,
	getInventories,
} from "../controllers/inventory.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

/**
 * @openapi
 * /api/v1/inventories:
 *   get:
 *     tags: [Inventories]
 *     summary: Retrieve paginated inventory stock
 *     description: Retrieves active product-item inventory with product, category, and brand information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page.
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by product code, variant name, or product name.
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID.
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by brand ID.
 *       - in: query
 *         name: stock_status
 *         schema:
 *           type: string
 *           enum: [available, low, out_of_stock]
 *         description: Filter stock status. Low stock is between 1 and 9 units.
 *     responses:
 *       200:
 *         description: Inventories retrieved successfully.
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
 *                   example: Inventories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_item_id:
 *                         type: string
 *                         format: uuid
 *                       product_code:
 *                         type: string
 *                         example: SAM-A55-128-NVY
 *                       product_name:
 *                         type: string
 *                         example: Galaxy A55
 *                       variant_name:
 *                         type: string
 *                         example: 8GB/128GB - Awesome Navy
 *                       brand:
 *                         type: string
 *                         example: Samsung
 *                       category:
 *                         type: string
 *                         example: Smartphone
 *                       stock:
 *                         type: integer
 *                         example: 5
 *                       stock_status:
 *                         type: string
 *                         enum: [available, low, out_of_stock]
 *                         example: low
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total_items:
 *                           type: integer
 *                           example: 1
 *                         total_pages:
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Invalid query parameter.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: Admin permission is required.
 */
router.get("/", getInventories);

/**
 * @openapi
 * /api/v1/inventories/{productItemId}/adjustments:
 *   post:
 *     tags: [Inventories]
 *     summary: Adjust product-item stock
 *     description: Updates stock and records one inventory movement. Correction sets the final physical stock count.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: productItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product item ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, quantity]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [addition, reduction, correction]
 *                 example: addition
 *                 description: Addition adds stock, reduction subtracts stock, and correction sets the final stock.
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: Restock from supplier
 *     responses:
 *       201:
 *         description: Stock adjusted successfully.
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
 *                   example: Stock adjusted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     product_item_id:
 *                       type: string
 *                       format: uuid
 *                     type:
 *                       type: string
 *                       enum: [addition, reduction, correction]
 *                     quantity:
 *                       type: integer
 *                       example: 10
 *                     stock_before:
 *                       type: integer
 *                       example: 5
 *                     stock_after:
 *                       type: integer
 *                       example: 15
 *                     note:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid adjustment payload or negative final stock.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: Admin permission and a valid CSRF token are required.
 *       404:
 *         description: Product item or inventory was not found.
 */
router.post("/:productItemId/adjustments", adjustStock);

export default router;
