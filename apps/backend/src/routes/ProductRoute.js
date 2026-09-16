/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { createAdditionalProductImage } from "../controllers/product-image.controller.js";
import {
	createProduct,
	deleteProduct,
	getProductById,
	getProducts,
	updateProduct,
} from "../controllers/product.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";
import productImageUpload, {
	limitProductImageUploads,
} from "../middleware/product-image-upload.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags: [Products]
 *     summary: Retrieve products
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter products by category id
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter products by brand id
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter products by active status
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Products retrieved successfully
 *               data:
 *                 - id: 3962d3bd-b9a6-4275-bf87-6cb6af71d943
 *                   name: Samsung Galaxy A55
 *                   image:
 *                     alt: Samsung Galaxy A55 smartphone
 *                     url: https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp
 *                   stock: 17
 *                   items:
 *                     - id: d7878d58-7742-4389-9c35-92d72351f200
 *                       name: 8GB/128GB - Awesome Navy
 *                       stock: 10
 *       400:
 *         description: Invalid query parameters
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin only)
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
 *             required: [categoryId, brandId, name]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Samsung Galaxy A55
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Samsung Galaxy A55 smartphone.
 *               isActive:
 *                 type: boolean
 *                 default: true
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [categoryId, brandId, name]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional AVIF, JPEG, PNG, or WebP image; maximum 5 MB. Alt uses product name.
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category or brand not found
 *       413:
 *         description: Image exceeds 5 MB
 *       415:
 *         description: Unsupported image type
 *       429:
 *         description: Too many image uploads
 */
router.get("/", getProducts);
router.post(
	"/",
	requireRole("admin"),
	limitProductImageUploads,
	productImageUpload,
	createProduct,
);

/**
 * @openapi
 * /api/v1/products/{id}/images:
 *   post:
 *     tags: [Product Images]
 *     summary: Add another image to an existing product (admin only)
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
 *             required: [alt, image]
 *             properties:
 *               alt:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: AVIF, JPEG, PNG, or WebP; maximum 5 MB.
 *     responses:
 *       201:
 *         description: Product image uploaded successfully
 *       400:
 *         description: Invalid image metadata
 *       404:
 *         description: Product not found
 *       413:
 *         description: Image exceeds 5 MB
 *       415:
 *         description: Unsupported image type
 */
router.post(
	"/:id/images",
	requireRole("admin"),
	limitProductImageUploads,
	productImageUpload,
	createAdditionalProductImage,
);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Retrieve product details, including all item stock and images
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
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Product retrieved successfully
 *               data:
 *                 id: 3962d3bd-b9a6-4275-bf87-6cb6af71d943
 *                 name: Samsung Galaxy A55
 *                 image:
 *                   alt: Samsung Galaxy A55 smartphone
 *                   url: https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp
 *                 stock: 17
 *                 items:
 *                   - id: d7878d58-7742-4389-9c35-92d72351f200
 *                     name: 8GB/128GB - Awesome Navy
 *                     image:
 *                       alt: Samsung Galaxy A55 Awesome Navy
 *                       url: https://res.cloudinary.com/nashta/image/upload/galaxy-a55-navy.webp
 *                     stock: 10
 *       400:
 *         description: Invalid product id
 *       404:
 *         description: Product not found
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (admin only)
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
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional AVIF, JPEG, PNG, or WebP image; maximum 5 MB. Alt uses product name.
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product, category, or brand not found
 *       413:
 *         description: Image exceeds 5 MB
 *       415:
 *         description: Unsupported image type
 *       429:
 *         description: Too many image uploads
 *   put:
 *     tags: [Products]
 *     summary: Update a product, optionally replacing its primary image (admin only)
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
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               brandId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional AVIF, JPEG, PNG, or WebP image; maximum 5 MB. Alt uses product name.
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Product, category, or brand not found
 *       413:
 *         description: Image exceeds 5 MB
 *       415:
 *         description: Unsupported image type
 *       429:
 *         description: Too many image uploads
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete a product (admin only)
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
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product id
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProductById);
router.patch(
	"/:id",
	requireRole("admin"),
	limitProductImageUploads,
	productImageUpload,
	updateProduct,
);
router.put(
	"/:id",
	requireRole("admin"),
	limitProductImageUploads,
	productImageUpload,
	updateProduct,
);
router.delete("/:id", requireRole("admin"), deleteProduct);

export default router;
