import process from "node:process";

import express from "express";
import { rateLimit } from "express-rate-limit";

/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import { getCsrfToken, login } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const isProduction = process.env.NODE_ENV === "production";

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: isProduction ? 5 : 1000,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many login attempts. Please try again in 15 minutes.",
	},
});

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and store JWT in an HttpOnly cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: cashier
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Cashier123!
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly authentication and CSRF cookies.
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successfully
 *                 data:
 *                   type: object
 *                   required: [id, fullname, role, csrfToken]
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     fullname:
 *                       type: string
 *                       example: System Administrator
 *                     role:
 *                       type: string
 *                       enum: [admin, cashier]
 *                     csrfToken:
 *                       type: string
 *                       description: Send this value in the X-CSRF-Token header for authenticated write requests.
 *       400:
 *         description: Username or password is required
 *       401:
 *         description: Invalid username or password
 *       429:
 *         description: Too many login attempts
 */
router.post("/login", loginLimiter, login);

/**
 * @openapi
 * /api/v1/auth/csrf-token:
 *   get:
 *     tags: [Auth]
 *     summary: Refresh the CSRF token for an authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSRF token retrieved successfully
 *         headers:
 *           Set-Cookie:
 *             description: Refreshed HttpOnly CSRF cookie.
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: CSRF token retrieved successfully
 *                 data:
 *                   type: object
 *                   required: [csrfToken]
 *                   properties:
 *                     csrfToken:
 *                       type: string
 *       401:
 *         description: Authentication is required
 */
router.get("/csrf-token", authMiddleware, getCsrfToken);

export default router;
