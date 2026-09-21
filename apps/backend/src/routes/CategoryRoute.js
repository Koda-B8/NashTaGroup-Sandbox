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
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name]
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Color
 *                     value:
 *                       type: string
 *                       nullable: true
 *                       example: Storage
 *                     isRequired:
 *                       type: boolean
 *                       default: false
 *                     isVariant:
 *                       type: boolean
 *                       default: true
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [name]
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Blue
 *                           hex:
 *                             type: string
 *                             nullable: true
 *                             example: "#3B82F6"
 *           example:
 *             name: Laptop
 *             attributes:
 *               - name: Colors
 *                 value: null
 *                 isRequired: true
 *                 isVariant: true
 *                 options:
 *                   - name: Blue
 *                     hex: "#3B82F6"
 *                   - name: Black
 *                     hex: "#111827"
 *               - name: Spesifikasi
 *                 value: Storage
 *                 isRequired: true
 *                 isVariant: true
 *                 options:
 *                   - name: 256GB
 *                   - name: 512GB
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
 *               attributes:
 *                 type: array
 *                 description: Full synchronization. Existing attributes omitted from this array are removed; unchanged attributes are not written again. Omit the entire attributes field to keep all attributes unchanged. Existing options are synchronized only when their options field is supplied.
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     value:
 *                       type: string
 *                       nullable: true
 *                     isRequired:
 *                       type: boolean
 *                     isVariant:
 *                       type: boolean
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           hex:
 *                             type: string
 *                             nullable: true
 *           example:
 *             attributes:
 *               - id: 11111111-1111-4111-8111-111111111111
 *                 name: Colors
 *                 value: null
 *                 isRequired: true
 *                 isVariant: true
 *                 options:
 *                   - id: 22222222-2222-4222-8222-222222222222
 *                     name: Blue
 *                     hex: "#3B82F6"
 *                   - id: 33333333-3333-4333-8333-333333333333
 *                     name: Black
 *                     hex: "#111827"
 *               - name: Spesifikasi
 *                 value: Storage
 *                 isRequired: true
 *                 isVariant: true
 *                 options:
 *                   - name: 256GB
 *                   - name: 512GB
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
