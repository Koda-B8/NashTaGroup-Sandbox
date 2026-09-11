/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import {
	CreateUser,
	deleteUser,
	getUserById,
	getUsers,
	updateUser,
} from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: Retrieve users
 *     description: Retrieve a paginated user list (admin only).
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by fullname or username.
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, cashier]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Users retrieved successfully
 *               data: []
 *               meta:
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total_items: 0
 *                   total_pages: 0
 *       400:
 *         description: Invalid query parameters
 *       403:
 *         description: Admin access required
 *   post:
 *     tags: [Users]
 *     summary: Create a user
 *     description: Create an Admin or Cashier account (admin only).
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
 *             additionalProperties: false
 *             required: [fullname, username, password, role]
 *             properties:
 *               fullname:
 *                 type: string
 *                 maxLength: 150
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *               role:
 *                 type: string
 *                 enum: [admin, cashier]
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request body
 *       409:
 *         description: Username is already in use
 */
router.get("/", getUsers);
router.post("/", CreateUser);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Retrieve a user by id
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Users]
 *     summary: Update a user
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
 *             additionalProperties: false
 *             properties:
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [admin, cashier]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: Username is already in use
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete a user
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
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user id or attempt to delete own account
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
