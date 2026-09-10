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
 *     summary: Mengambil daftar category
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari category berdasarkan nama
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif category
 *     responses:
 *       200:
 *         description: Category berhasil diambil
 *       401:
 *         description: Token tidak valid atau tidak tersedia
 */
router.get("/", getCategories);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Mengambil detail category berdasarkan ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detail category berhasil diambil
 *       401:
 *         description: Token tidak valid atau tidak tersedia
 *       404:
 *         description: Category tidak ditemukan
 */
router.get("/:id", getCategoryById);

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Membuat category baru
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
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
 *         description: Category berhasil dibuat
 *       400:
 *         description: Nama category wajib diisi
 *       401:
 *         description: Token tidak valid atau tidak tersedia
 *       403:
 *         description: Hanya admin yang dapat membuat category
 *       409:
 *         description: Nama category sudah ada
 */
router.post("/", requireRole("admin"), createCategory);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Memperbarui category
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
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
 *         description: Category berhasil diperbarui
 *       400:
 *         description: Data update tidak valid
 *       401:
 *         description: Token tidak valid atau tidak tersedia
 *       403:
 *         description: Hanya admin yang dapat memperbarui category
 *       404:
 *         description: Category tidak ditemukan
 *       409:
 *         description: Nama category sudah ada
 */
router.patch("/:id", requireRole("admin"), updateCategory);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Menghapus category secara soft delete
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category berhasil dihapus
 *       401:
 *         description: Token tidak valid atau tidak tersedia
 *       403:
 *         description: Hanya admin yang dapat menghapus category
 *       404:
 *         description: Category tidak ditemukan
 */
router.delete("/:id", requireRole("admin"), deleteCategory);

export default router;
