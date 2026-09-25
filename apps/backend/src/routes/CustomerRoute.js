/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { getCustomers } from "../controllers/customer.controller.js";
import authMiddleware from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));

/**
 * @openapi
 * /api/v1/customers:
 *   get:
 *     tags: [Customers]
 *     summary: Retrieve customers
 *     description: Retrieve a paginated customer list (admin only), newest first.
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
 *         description: Case-insensitive search by customer name or phone number.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at_desc, created_at_asc, name_asc, name_desc]
 *           default: created_at_desc
 *         description: Sort the list using a supported field and direction.
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data, meta]
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Customers retrieved successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, name, phone, created_at]
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string, nullable: true }
 *                       phone: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                 meta:
 *                   type: object
 *                   required: [pagination]
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       required: [page, limit, total_items, total_pages]
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 20 }
 *                         total_items: { type: integer, example: 1 }
 *                         total_pages: { type: integer, example: 1 }
 *       400:
 *         description: Invalid pagination query.
 *       401:
 *         description: Token is invalid or unavailable.
 *       403:
 *         description: Admin access required.
 */
router.get("/", getCustomers);

export default router;
