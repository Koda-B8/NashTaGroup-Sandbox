/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { getCashierProducts } from "../controllers/cashier-product.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware, requireRole("cashier", "admin"));

/**
 * @openapi
 * /api/v1/cashier/products:
 *   get:
 *     tags: [Cashier]
 *     summary: Retrieve products and their SKU combinations for the cashier browser
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
 *         description: Search by product name, variant name, or product code.
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: brand_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: min_price
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: max_price
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: in_stock
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name_asc, name_desc, price_asc, price_desc]
 *           default: name_asc
 *     responses:
 *       200:
 *         description: Cashier products retrieved successfully. Each item's priceDifference is its price minus the cheapest active item price with the same colorId.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Cashier products retrieved successfully
 *               data:
 *                 - id: 3962d3bd-b9a6-4275-bf87-6cb6af71d943
 *                   categoryId: a8fc757d-d382-498b-b91a-afad8ad7cc31
 *                   brandId: 1524d65a-df46-4edf-ae6d-d4dd62607d89
 *                   name: Samsung Galaxy A55
 *                   category: { id: a8fc757d-d382-498b-b91a-afad8ad7cc31, name: Smartphone, isActive: true }
 *                   brand: { id: 1524d65a-df46-4edf-ae6d-d4dd62607d89, name: Samsung, isActive: true }
 *                   attributes:
 *                     - title: Colors
 *                       items:
 *                         - { id: 76a36755-1905-483b-a7d1-dcd65ad43768, name: Blue, hex: "#3B82F6" }
 *                   items:
 *                     - id: d7878d58-7742-4389-9c35-92d72351f200
 *                       productCode: SAM-A55-128-NVY
 *                       price: "5999000.00"
 *                       priceDifference: "0.00"
 *                       colorId: 76a36755-1905-483b-a7d1-dcd65ad43768
 *                       specsId: ""
 *                       isActive: true
 *                       stock: 10
 *                   image: { alt: Samsung Galaxy A55, url: null }
 *                   stock: 10
 *               meta:
 *                 pagination: { page: 1, limit: 20, total_items: 1, total_pages: 1 }
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Cashier or admin access required
 */
router.get("/", getCashierProducts);

export default router;
