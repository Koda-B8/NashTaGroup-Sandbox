import { constants } from "node:http2";

import db from "../models/index.cjs";

const { Roles, Users } = db;
const ALLOWED_ROLES = new Set(["admin", "cashier"]);
const ALLOWED_FIELDS = new Set([
	"fullname",
	"username",
	"password",
	"role",
	"isActive",
]);

const sendError = (response, status, message) =>
	response.status(status).json({ success: false, message });

const toUserResponse = (user) => {
	const value = typeof user?.toJSON === "function" ? user.toJSON() : user;

	return {
		...value,
		cashierId: value.id,
	};
};

export async function getUsers(_request, response, next) {
	try {
		const users = await Users.findAll({
			attributes: ["id", "fullname", "username", "isActive", "createdAt"],
			include: [
				{
					model: Roles,
					as: "role",
					attributes: ["id", "name"],
				},
			],
			order: [["fullname", "ASC"]],
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Users retrieved successfully",
			data: users.map((user) => toUserResponse(user)),
		});
	} catch (error) {
		return next(error);
	}
}

function validateCreateUser(body) {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return { error: "Request body must be an object" };
	}

	const unknownField = Object.keys(body).find(
		(field) => !ALLOWED_FIELDS.has(field),
	);
	if (unknownField) return { error: `Unknown field: ${unknownField}` };

	const value = {};
	for (const field of ["fullname", "username", "password", "role"]) {
		if (typeof body[field] !== "string" || !body[field].trim()) {
			return { error: `${field} must be a non-empty string` };
		}
		value[field] = body[field].trim();
	}

	if (value.fullname.length > 150) {
		return { error: "fullname must not exceed 150 characters" };
	}
	if (
		value.username.length < 3 ||
		value.username.length > 100 ||
		!/^[a-zA-Z0-9._-]+$/.test(value.username)
	) {
		return {
			error:
				"username must be 3-100 characters and contain only letters, numbers, dots, underscores, or hyphens",
		};
	}
	if (value.password.length < 8 || value.password.length > 128) {
		return { error: "password must contain between 8 and 128 characters" };
	}

	value.role = value.role.toLowerCase();
	if (!ALLOWED_ROLES.has(value.role)) {
		return { error: "role must be either admin or cashier" };
	}

	if ("isActive" in body) {
		if (typeof body.isActive !== "boolean") {
			return { error: "isActive must be a boolean" };
		}
		value.isActive = body.isActive;
	}

	return { value };
}

export async function CreateUser(request, response, next) {
	const validation = validateCreateUser(request.body);
	if (!validation.value) {
		return sendError(
			response,
			constants.HTTP_STATUS_BAD_REQUEST,
			validation.error ?? "Invalid request body",
		);
	}

	const data = validation.value;
	try {
		const role = await Roles.findOne({ where: { name: data.role } });
		if (!role) {
			return sendError(
				response,
				constants.HTTP_STATUS_BAD_REQUEST,
				"Role not found",
			);
		}

		const user = await Users.create({
			fullname: data.fullname,
			username: data.username,
			password: data.password,
			role_id: role.id,
			...(data.isActive === undefined ? {} : { isActive: data.isActive }),
		});

		return response.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "User created successfully",
			data: {
				id: user.id,
				fullname: user.fullname,
				username: user.username,
				role: role.name,
				isActive: user.isActive,
			},
		});
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"name" in error &&
			error.name === "SequelizeUniqueConstraintError"
		) {
			return sendError(
				response,
				constants.HTTP_STATUS_CONFLICT,
				"Username is already in use",
			);
		}

		return next(error);
	}
}
