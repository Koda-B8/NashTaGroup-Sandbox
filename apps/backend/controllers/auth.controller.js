import { constants } from "node:http2";

import argon2 from "argon2";

import { signToken } from "../lib/jwt.js";
import db from "../models/index.cjs";

const { Roles, Users } = db;

const unauthorized = (res) =>
	res.status(constants.HTTP_STATUS_UNAUTHORIZED).json({
		success: false,
		message: "Invalid username or password",
	});

export async function login(req, res) {
	try {
		const username =
			typeof req.body?.username === "string" ? req.body.username.trim() : "";
		const { password } = req.body ?? {};

		if (!username || typeof password !== "string" || !password) {
			return res.status(constants.HTTP_STATUS_BAD_REQUEST).json({
				success: false,
				message: "Username or password required",
			});
		}

		const user = await Users.scope("withPassword").findOne({
			where: { username },
			include: [
				{
					model: Roles,
					as: "role",
					attributes: ["name"],
					required: true,
				},
			],
		});

		if (!user?.isActive) return unauthorized(res);

		const isMatch = await argon2.verify(user.password, password);
		if (!isMatch) return unauthorized(res);

		const role = user.role.name;
		const token = signToken({ userId: user.id, userRole: role });

		res.cookie("auth_token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 24 * 60 * 60 * 1000,
			path: "/",
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Login successfully",
			token,
			data: {
				id: user.id,
				fullname: user.fullname,
				role,
			},
		});
	} catch {
		return res.status(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Internal server error",
		});
	}
}
