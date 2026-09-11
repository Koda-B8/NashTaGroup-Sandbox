import { constants } from "node:http2";

import { Op } from "sequelize";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";

const { Roles, Users } = db;
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ROLES = new Set(["admin", "cashier"]);
const ALLOWED_FIELDS = new Set([
	"fullname",
	"username",
	"password",
	"role",
	"is_active",
]);

const sendError = (response, status, message) =>
	response.status(status).json({ success: false, message });

class HttpError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
	}
}

const createHttpError = (statusCode, message) =>
	new HttpError(statusCode, message);

const userAttributes = ["id", "fullname", "username", "isActive", "createdAt"];
const userInclude = (roleName) => [
	{
		model: Roles,
		as: "role",
		attributes: ["id", "name"],
		...(roleName ? { where: { name: roleName }, required: true } : {}),
	},
];

const isUuid = (value) => typeof value === "string" && UUID_PATTERN.test(value);

const parseBoolean = (value) => {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;
};

const toUserResponse = (user) => {
	const value = typeof user?.toJSON === "function" ? user.toJSON() : user;
	const { createdAt, isActive, ...userData } = value;

	return {
		...userData,
		is_active: isActive,
		created_at: createdAt,
	};
};

export async function getUsers(request, response, next) {
	try {
		const search =
			typeof request.query.q === "string" ? request.query.q.trim() : "";
		const isActive = parseBoolean(request.query.is_active);
		const role =
			typeof request.query.role === "string"
				? request.query.role.trim().toLowerCase()
				: "";

		if (request.query.is_active !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"is_active must be true or false",
			);
		}
		if (role && !ALLOWED_ROLES.has(role)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"role must be either admin or cashier",
			);
		}

		const where = {};
		if (search) {
			where[Op.or] = [
				{ fullname: { [Op.iLike]: `%${search}%` } },
				{ username: { [Op.iLike]: `%${search}%` } },
			];
		}
		if (isActive !== undefined) where.isActive = isActive;

		const { rows, pagination } = await paginate(Users, request.query, {
			where,
			attributes: userAttributes,
			include: userInclude(role),
			order: [["fullname", "ASC"]],
			distinct: true,
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Users retrieved successfully",
			data: rows.map((user) => toUserResponse(user)),
			meta: { pagination },
		});
	} catch (error) {
		return next(error);
	}
}

export async function getUserById(request, response, next) {
	try {
		if (!isUuid(request.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"User id must be a valid UUID",
			);
		}

		const user = await Users.findByPk(request.params.id, {
			attributes: userAttributes,
			include: userInclude(),
		});
		if (!user) {
			throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "User not found");
		}

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "User retrieved successfully",
			data: toUserResponse(user),
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

	if ("is_active" in body) {
		if (typeof body.is_active !== "boolean") {
			return { error: "is_active must be a boolean" };
		}
		value.isActive = body.is_active;
	}

	return { value };
}

function validateUpdateUser(body) {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return { error: "Request body must be an object" };
	}

	const unknownField = Object.keys(body).find(
		(field) => !ALLOWED_FIELDS.has(field),
	);
	if (unknownField) return { error: `Unknown field: ${unknownField}` };
	if (Object.keys(body).length === 0) {
		return { error: "At least one field is required" };
	}

	const value = {};
	if (Object.hasOwn(body, "fullname")) {
		if (typeof body.fullname !== "string" || !body.fullname.trim()) {
			return { error: "fullname must be a non-empty string" };
		}
		value.fullname = body.fullname.trim();
		if (value.fullname.length > 150) {
			return { error: "fullname must not exceed 150 characters" };
		}
	}

	if (Object.hasOwn(body, "username")) {
		if (typeof body.username !== "string" || !body.username.trim()) {
			return { error: "username must be a non-empty string" };
		}
		value.username = body.username.trim();
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
	}

	if (Object.hasOwn(body, "password")) {
		if (typeof body.password !== "string") {
			return { error: "password must be a string" };
		}
		if (body.password.length < 8 || body.password.length > 128) {
			return { error: "password must contain between 8 and 128 characters" };
		}
		value.password = body.password;
	}

	if (Object.hasOwn(body, "role")) {
		if (typeof body.role !== "string" || !body.role.trim()) {
			return { error: "role must be a non-empty string" };
		}
		value.role = body.role.trim().toLowerCase();
		if (!ALLOWED_ROLES.has(value.role)) {
			return { error: "role must be either admin or cashier" };
		}
	}

	if (Object.hasOwn(body, "is_active")) {
		if (typeof body.is_active !== "boolean") {
			return { error: "is_active must be a boolean" };
		}
		value.isActive = body.is_active;
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
				is_active: user.isActive,
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

export async function updateUser(request, response, next) {
	if (!isUuid(request.params.id)) {
		return sendError(
			response,
			constants.HTTP_STATUS_BAD_REQUEST,
			"User id must be a valid UUID",
		);
	}

	const validation = validateUpdateUser(request.body);
	if (!validation.value) {
		return sendError(
			response,
			constants.HTTP_STATUS_BAD_REQUEST,
			validation.error ?? "Invalid request body",
		);
	}

	try {
		const user = await Users.findByPk(request.params.id);
		if (!user) {
			return sendError(
				response,
				constants.HTTP_STATUS_NOT_FOUND,
				"User not found",
			);
		}

		/** @type {Record<string, unknown>} */
		const updates = { ...validation.value };
		if (updates.role) {
			const role = await Roles.findOne({ where: { name: updates.role } });
			if (!role) {
				return sendError(
					response,
					constants.HTTP_STATUS_BAD_REQUEST,
					"Role not found",
				);
			}
			updates.role_id = role.id;
			delete updates.role;
		}

		await user.update(updates);
		const updatedUser = await Users.findByPk(user.id, {
			attributes: userAttributes,
			include: userInclude(),
		});
		if (!updatedUser) {
			return sendError(
				response,
				constants.HTTP_STATUS_NOT_FOUND,
				"User not found",
			);
		}

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "User updated successfully",
			data: toUserResponse(updatedUser),
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

export async function deleteUser(request, response, next) {
	try {
		if (!isUuid(request.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"User id must be a valid UUID",
			);
		}

		const user = await Users.findByPk(request.params.id);
		if (!user) {
			throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "User not found");
		}
		if (request.user?.id === user.id) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"You cannot delete your own account",
			);
		}

		await user.destroy();
		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
}
