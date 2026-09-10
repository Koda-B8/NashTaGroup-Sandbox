/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { getBrandById, getBrands } from "../controllers/brand.controller.js";
import authMiddleware from "../middleware/auth.js";

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

export default router;
