/* oxlint-disable unicorn/filename-case */
/* eslint-disable jsdoc/check-tag-names */

import express from "express";

import { login } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dan mendapatkan JWT
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
 *       400:
 *         description: Username atau password kosong
 *       401:
 *         description: Username atau password salah
 */
router.post("/login", login);

export default router;
