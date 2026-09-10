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
 *     summary: Mengambil seluruh user
 *     description: Hanya Admin yang dapat melihat daftar user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar user berhasil diambil
 *       401:
 *         description: Token tidak tersedia atau tidak valid
 *       403:
 *         description: Pengguna bukan Admin
 */
router.get("/", authMiddleware, requireRole("admin"), getUsers);

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: Membuat user baru
 *     description: Hanya Admin yang dapat membuat akun Admin atau Cashier.
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
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
 *         description: User berhasil dibuat
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
 *         description: Request body atau role tidak valid
 *       401:
 *         description: Token tidak tersedia atau tidak valid
 *       403:
 *         description: Pengguna bukan Admin
 *       409:
 *         description: Username sudah digunakan
 */
router.post("/", authMiddleware, requireRole("admin"), CreateUser);

export default router;
