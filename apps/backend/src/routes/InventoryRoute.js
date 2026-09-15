import express from "express";
/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */

import { getInventories } from "../controllers/inventory.controller.js";
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

export default router;
