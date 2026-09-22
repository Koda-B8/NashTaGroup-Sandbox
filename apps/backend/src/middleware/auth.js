import { constants } from "node:http2";

import { verifyToken } from "../lib/jwt.js";
import db from "../models/index.cjs";

const { Users, Roles } = db;

const unauthorized = (
	res,
	message = "Unauthorized: token tidak valid atau kadaluarsa",
) =>
	res.status(constants.HTTP_STATUS_UNAUTHORIZED).json({
		success: false,
		message,
	});

export function getRequestToken(request) {
	const cookieToken = request.cookies?.auth_token;
	if (typeof cookieToken === "string" && cookieToken) return cookieToken;

	const authHeader =
		request.header?.("Authorization") ?? request.headers?.authorization;
	const [scheme, bearerToken, ...extraParts] =
		authHeader?.trim().split(/\s+/) ?? [];

	if (
		scheme?.toLowerCase() !== "bearer" ||
		!bearerToken ||
		extraParts.length > 0
	) {
		return;
	}

	return bearerToken;
}

export async function authenticateToken(token) {
	let decoded;
	try {
		decoded = verifyToken(token);
	} catch {
		return;
	}

	if (
		typeof decoded !== "object" ||
		!decoded ||
		typeof decoded.userId !== "string" ||
		!decoded.userId
	) {
		return;
	}

	const user = await Users.findByPk(decoded.userId, {
		include: [
			{
				model: Roles,
				as: "role",
				attributes: ["name"],
				required: true,
			},
		],
	});

	if (!user?.isActive || typeof user.role?.name !== "string") return;

	return {
		id: user.id,
		username: user.username,
		fullname: user.fullname,
		role: user.role.name,
	};
}

async function authMiddleware(req, res, next) {
	const token = getRequestToken(req);
	if (!token) return unauthorized(res, "Unauthorized: token tidak ditemukan");

	try {
		const user = await authenticateToken(token);
		if (!user) return unauthorized(res);

		req.user = user;
		return next();
	} catch (error) {
		return next(error);
	}
}

export default authMiddleware;
