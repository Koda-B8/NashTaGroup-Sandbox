/* oxlint-disable jsdoc/check-tag-names -- @openapi is consumed by swagger-jsdoc. */
import express from "express";

import { getPaymentMethods } from "../controllers/payment-method.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/payment-methods:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Retrieve payment methods
 *     description: Retrieve payment methods available to authenticated users.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter payment methods by active status.
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       400:
 *         description: is_active must be true or false
 *       401:
 *         description: Token is invalid or unavailable
 */
router.get("/", getPaymentMethods);

export default router;
