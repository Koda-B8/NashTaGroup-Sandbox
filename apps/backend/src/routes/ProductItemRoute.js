/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import {
	createProductItem,
	deleteProductItem,
	getProductItemById,
	getProductItems,
	updateProductItem,
} from "../controllers/product-item.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/product-items:
 *   get:
 *     tags: [Product Items]
 *     summary: Retrieve product items
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search product items by name or product code
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter product items by product id
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter product items by active status
 *     responses:
 *       200:
 *         description: Product items retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *   post:
 *     tags: [Product Items]
 *     summary: Create a product item (admin only)
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, productCode, name, price]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               productCode:
 *                 type: string
 *                 example: SAM-A55-256-BLU
 *               name:
 *                 type: string
 *                 example: Samsung Galaxy A55 256GB Blue
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 6499000
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Product item created successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product code already exists
 */
router.get("/", getProductItems);
router.post("/", requireRole("admin"), createProductItem);

/**
 * @openapi
 * /api/v1/product-items/{id}:
 *   get:
 *     tags: [Product Items]
 *     summary: Retrieve a product item by id
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
 *         description: Product item retrieved successfully
 *       400:
 *         description: Invalid product item id
 *       404:
 *         description: Product item not found
 *   patch:
 *     tags: [Product Items]
 *     summary: Update a product item (admin only)
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               productCode:
 *                 type: string
 *                 example: SAM-A55-256-BLU
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 6499000
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product item updated successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product item or product not found
 *       409:
 *         description: Product code already exists
 *   delete:
 *     tags: [Product Items]
 *     summary: Soft delete a product item (admin only)
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
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
 *         description: Product item deleted successfully
 *       400:
 *         description: Invalid product item id
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product item not found
 */
router.get("/:id", getProductItemById);
router.patch("/:id", requireRole("admin"), updateProductItem);
router.delete("/:id", requireRole("admin"), deleteProductItem);

export default router;
