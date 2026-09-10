import express from "express";
/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
// import { rateLimit } from "express-rate-limit";

import { login } from "../controllers/auth.controller.js";

const router = express.Router();

// const loginLimiter = rateLimit({
// 	windowMs: 15 * 60 * 1000,
// 	limit: 5,
// 	standardHeaders: "draft-8",
// 	legacyHeaders: false,
// 	message: {
// 		success: false,
// 		message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
// 	},
// });

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dan menyimpan JWT dalam cookie HttpOnly
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
 *         description: Login berhasil
 *         headers:
 *           Set-Cookie:
 *             description: Cookie autentikasi HttpOnly
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
 *                   required: [id, fullname, role]
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     fullname:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, cashier]
 *       400:
 *         description: Username atau password kosong
 *       401:
 *         description: Username atau password salah
 */
router.post("/login", /* loginLimiter, */ login);

export default router;
