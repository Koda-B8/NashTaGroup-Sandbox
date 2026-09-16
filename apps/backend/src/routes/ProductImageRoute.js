/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import {
	deleteProductImage,
	getProductImages,
	replaceProductImage,
	retryProductImageCleanups,
	updateProductImage,
} from "../controllers/product-image.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import productImageUpload, {
	limitProductImageUploads,
} from "../middleware/product-image-upload.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

/**
 * @openapi
 * /api/v1/product-images:
 *   get:
 *     tags: [Product Images]
 *     summary: Retrieve manageable images for a product or product item
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: productItemId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Omit this field to retrieve product-level images.
 *     responses:
 *       200:
 *         description: Product images retrieved successfully
 *       400:
 *         description: Invalid target
 *       404:
 *         description: Product or product item not found
 */
router.get("/", getProductImages);

/**
 * @openapi
 * /api/v1/product-images/cleanup/retry:
 *   post:
 *     tags: [Product Images]
 *     summary: Retry pending Cloudinary asset deletions (admin only)
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retry completed; reports cleared and remaining assets
 */
router.post("/cleanup/retry", retryProductImageCleanups);

/**
 * @openapi
 * /api/v1/product-images/{id}:
 *   patch:
 *     tags: [Product Images]
 *     summary: Update product image metadata without replacing its file
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
 *               alt:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Product image updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Product image not found
 *   put:
 *     tags: [Product Images]
 *     summary: Replace only the Cloudinary file of a product image
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: AVIF, JPEG, PNG, or WebP; maximum 5 MB.
 *     responses:
 *       200:
 *         description: Product image file replaced successfully
 *       404:
 *         description: Product image not found
 *       413:
 *         description: Image exceeds 5 MB
 *       415:
 *         description: Unsupported image type
 *   delete:
 *     tags: [Product Images]
 *     summary: Delete a product image and its Cloudinary asset
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
 *         description: Product image deleted successfully
 *       404:
 *         description: Product image not found
 */
router.patch("/:id", updateProductImage);
router.delete("/:id", deleteProductImage);

router.put(
	"/:id",
	limitProductImageUploads,
	productImageUpload,
	replaceProductImage,
);

export default router;
