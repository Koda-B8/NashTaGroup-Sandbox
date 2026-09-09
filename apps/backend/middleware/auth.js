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

async function authMiddleware(req, res, next) {
	const authHeader = req.header("Authorization");
	const [scheme, token, ...extraParts] = authHeader?.trim().split(/\s+/) ?? [];

	if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
		return unauthorized(res, "Unauthorized: token tidak ditemukan");
	}

	let decoded;
	try {
		decoded = verifyToken(token);
	} catch {
		return unauthorized(res);
	}

	if (
		typeof decoded !== "object" ||
		!decoded ||
		typeof decoded.userId !== "string" ||
		!decoded.userId
	) {
		return unauthorized(res);
	}

	try {
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

		if (!user?.isActive || typeof user.role?.name !== "string") {
			return unauthorized(res);
		}

		req.user = {
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			role: user.role.name,
		};

		return next();
	} catch (error) {
		return next(error);
	}
}

export default authMiddleware;
