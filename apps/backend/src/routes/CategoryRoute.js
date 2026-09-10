/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategoryById,
	updateCategory,
} from "../controllers/category.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Retrieve category list
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search categories by name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter category active status
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       401:
 *         description: Token is invalid or unavailable
 */
router.get("/", getCategories);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Retrieve category details by ID
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
 *         description: Category details retrieved successfully
 *       401:
 *         description: Token is invalid or unavailable
 *       404:
 *         description: Category not found
 */
router.get("/:id", getCategoryById);

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
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
 *               name:
 *                 type: string
 *                 example: Gaming
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category name is required
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Only admins can create categories
 *       409:
 *         description: Category name already exists
 */
router.post("/", requireRole("admin"), createCategory);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category
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
 *               name:
 *                 type: string
 *                 example: Gaming Accessories
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Only admins can update categories
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category name already exists
 */
router.patch("/:id", requireRole("admin"), updateCategory);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category via soft delete
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
 *         description: Category deleted successfully
 *       401:
 *         description: Token is invalid or unavailable
 *       403:
 *         description: Only admins can delete categories
 *       404:
 *         description: Category not found
 */
router.delete("/:id", requireRole("admin"), deleteCategory);

export default router;
