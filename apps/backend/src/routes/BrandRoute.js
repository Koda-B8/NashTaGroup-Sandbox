/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import {
	createBrand,
	deleteBrand,
	getBrandById,
	getBrands,
	updateBrand,
} from "../controllers/brand.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/brands:
 *   get:
 *     tags: [Brands]
 *     summary: Retrieve brands
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search brands by name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter brands by active status
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get("/", getBrands);

/**
 * @openapi
 * /api/v1/brands:
 *   post:
 *     tags: [Brands]
 *     summary: Create a brand
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
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 100, example: Samsung }
 *     responses:
 *       201: { description: Brand created successfully }
 *       400: { description: Invalid brand payload }
 *       403: { description: Admin permission and a valid CSRF token are required }
 *       409: { description: Brand name already exists }
 */
router.post("/", requireRole("admin"), createBrand);

/**
 * @openapi
 * /api/v1/brands/{id}:
 *   get:
 *     tags: [Brands]
 *     summary: Retrieve a brand by id
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
 *         description: Brand retrieved successfully
 *       400:
 *         description: Invalid brand id
 *       404:
 *         description: Brand not found
 */
router.get("/:id", getBrandById);

/**
 * @openapi
 * /api/v1/brands/{id}:
 *   patch:
 *     tags: [Brands]
 *     summary: Update a brand
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               is_active: { type: boolean }
 *     responses:
 *       200: { description: Brand updated successfully }
 *       400: { description: Invalid brand payload or id }
 *       403: { description: Admin permission and a valid CSRF token are required }
 *       404: { description: Brand not found }
 *       409: { description: Brand name already exists }
 *   delete:
 *     tags: [Brands]
 *     summary: Delete a brand
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Brand deleted successfully }
 *       400: { description: Invalid brand id }
 *       403: { description: Admin permission and a valid CSRF token are required }
 *       404: { description: Brand not found }
 *       409: { description: Brand is used by products }
 */
router.patch("/:id", requireRole("admin"), updateBrand);
router.delete("/:id", requireRole("admin"), deleteBrand);

export default router;
