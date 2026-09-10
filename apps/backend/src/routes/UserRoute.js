import express from "express";
/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */

import { CreateUser, getUsers } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: Retrieve all users
 *     description: Only Admin can view the user list.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User list retrieved successfully
 *       401:
 *         description: Token is unavailable or invalid
 *       403:
 *         description: User is not an Admin
 */
router.get("/", authMiddleware, requireRole("admin"), getUsers);

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: Only Admin can create Admin or Cashier accounts.
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
 *                 example: Demo Cashier
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 pattern: '^[a-zA-Z0-9._-]+$'
 *                 example: cashier2
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: Cashier123!
 *               role:
 *                 type: string
 *                 enum: [admin, cashier]
 *                 example: cashier
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: User created successfully
 *               data:
 *                 id: 7bf0806e-daca-4afa-a2e1-643babe31176
 *                 fullname: Demo Cashier
 *                 username: cashier2
 *                 role: cashier
 *                 isActive: true
 *       400:
 *         description: Request body or role is invalid
 *       401:
 *         description: Token is unavailable or invalid
 *       403:
 *         description: User is not an Admin
 *       409:
 *         description: Username is already used
 */
router.post("/", authMiddleware, requireRole("admin"), CreateUser);

export default router;
