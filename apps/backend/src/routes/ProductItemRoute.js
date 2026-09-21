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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Product items retrieved successfully
 *               data:
 *                 - id: d7878d58-7742-4389-9c35-92d72351f200
 *                   productCode: SAM-A55-128-NVY
 *                   name: 8GB/128GB - Awesome Navy
 *                   price: "5999000.00"
 *                   stock: 10
 *                   image:
 *                     alt: Samsung Galaxy A55 smartphone
 *                     url: https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp
 *                   product:
 *                     id: 3962d3bd-b9a6-4275-bf87-6cb6af71d943
 *                     name: Samsung Galaxy A55
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
 *             required: [productId, productCode, price]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               productCode:
 *                 type: string
 *                 example: SAM-A55-256-BLU
 *               name:
 *                 type: string
 *                 description: Optional fallback when the category has no variant attributes. Otherwise generated from selected attributes.
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 6499000
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Initial inventory stock for this SKU.
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               attributes:
 *                 type: array
 *                 description: Category attribute options selected by this SKU.
 *                 items:
 *                   type: object
 *                   required: [attributeId, optionId]
 *                   properties:
 *                     attributeId:
 *                       type: string
 *                       format: uuid
 *                     optionId:
 *                       type: string
 *                       format: uuid
 *           example:
 *             productId: 99999999-9999-4999-8999-999999999999
 *             productCode: ASU-VB14-BLU-512
 *             price: "10999000"
 *             stock: 22
 *             isActive: true
 *             attributes:
 *               - attributeId: 11111111-1111-4111-8111-111111111111
 *                 optionId: 22222222-2222-4222-8222-222222222222
 *               - attributeId: 44444444-4444-4444-8444-444444444444
 *                 optionId: 66666666-6666-4666-8666-666666666666
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
 *         description: Product code or variant combination already exists
 */
router.get("/", getProductItems);
router.post("/", requireRole("admin"), createProductItem);

/**
 * @openapi
 * /api/v1/product-items/{id}:
 *   get:
 *     tags: [Product Items]
 *     summary: Retrieve a product item with product, category, brand, and image details
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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Product item retrieved successfully
 *               data:
 *                 id: d7878d58-7742-4389-9c35-92d72351f200
 *                 productCode: SAM-A55-128-NVY
 *                 name: 8GB/128GB - Awesome Navy
 *                 price: "5999000.00"
 *                 stock: 10
 *                 image:
 *                   alt: Samsung Galaxy A55 smartphone
 *                   url: https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp
 *                 product:
 *                   id: 3962d3bd-b9a6-4275-bf87-6cb6af71d943
 *                   name: Samsung Galaxy A55
 *                   category:
 *                     name: Smartphone
 *                   brand:
 *                     name: Samsung
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
 *                 description: Used only when attributes do not generate a variant name.
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 6499000
 *               isActive:
 *                 type: boolean
 *               attributes:
 *                 type: array
 *                 description: Full replacement of selected category attribute options. The item name is regenerated.
 *                 items:
 *                   type: object
 *                   required: [attributeId, optionId]
 *                   properties:
 *                     attributeId:
 *                       type: string
 *                       format: uuid
 *                     optionId:
 *                       type: string
 *                       format: uuid
 *           example:
 *             productCode: ASU-VB14-BLK-512
 *             price: "11499000"
 *             isActive: true
 *             attributes:
 *               - attributeId: 11111111-1111-4111-8111-111111111111
 *                 optionId: 33333333-3333-4333-8333-333333333333
 *               - attributeId: 44444444-4444-4444-8444-444444444444
 *                 optionId: 66666666-6666-4666-8666-666666666666
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
 *         description: Product code or variant combination already exists
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
