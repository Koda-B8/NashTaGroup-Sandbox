import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import {
	CreateUser,
	deleteUser,
	getUserById,
	getUsers,
	updateUser,
} from "./user.controller.js";

vi.mock("../models/index.cjs", () => ({
	default: {
		Roles: { findOne: vi.fn() },
		Users: { create: vi.fn(), findAndCountAll: vi.fn(), findByPk: vi.fn() },
	},
}));

const role = {
	id: "34b01aa9-6990-43bc-aed7-00234cddbf52",
	name: "cashier",
};
const user = {
	id: "7bf0806e-daca-4afa-a2e1-643babe31176",
	fullname: "Demo Cashier",
	username: "cashier2",
	isActive: true,
	createdAt: "2026-09-07T09:30:00.000Z",
};

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("CreateUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		db.Roles.findOne.mockResolvedValue(role);
		db.Users.create.mockResolvedValue(user);
	});

	it("creates a user with the selected role", async () => {
		const response = createResponse();
		const next = vi.fn();

		await CreateUser(
			{
				body: {
					fullname: " Demo Cashier ",
					username: " cashier2 ",
					password: "Cashier123!",
					role: "CASHIER",
				},
			},
			response,
			next,
		);

		expect(db.Roles.findOne).toHaveBeenCalledWith({
			where: { name: "cashier" },
		});
		expect(db.Users.create).toHaveBeenCalledWith({
			fullname: "Demo Cashier",
			username: "cashier2",
			password: "Cashier123!",
			role_id: role.id,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "User created successfully",
			data: {
				id: user.id,
				fullname: user.fullname,
				username: user.username,
				role: "cashier",
				is_active: true,
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("passes the optional active status to the model", async () => {
		const response = createResponse();

		await CreateUser(
			{
				body: {
					fullname: "Inactive Cashier",
					username: "inactive.cashier",
					password: "Cashier123!",
					role: "cashier",
					is_active: false,
				},
			},
			response,
			vi.fn(),
		);

		expect(db.Users.create).toHaveBeenCalledWith(
			expect.objectContaining({ isActive: false }),
		);
	});

	it.each([
		[undefined, "Request body must be an object"],
		[[], "Request body must be an object"],
		[
			{
				fullname: "Cashier",
				username: "cashier2",
				password: "Cashier123!",
				role: "cashier",
				unexpected: true,
			},
			"Unknown field: unexpected",
		],
		[
			{
				fullname: "Cashier",
				username: "ab",
				password: "Cashier123!",
				role: "cashier",
			},
			"username must be 3-100 characters and contain only letters, numbers, dots, underscores, or hyphens",
		],
		[
			{
				fullname: "Cashier",
				username: "cashier2",
				password: "short",
				role: "cashier",
			},
			"password must contain between 8 and 128 characters",
		],
		[
			{
				fullname: "Manager",
				username: "manager",
				password: "Manager123!",
				role: "manager",
			},
			"role must be either admin or cashier",
		],
	])("rejects invalid payloads", async (body, message) => {
		const response = createResponse();
		const next = vi.fn();

		await CreateUser({ body }, response, next);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_BAD_REQUEST,
		);
		expect(response.json).toHaveBeenCalledWith({ success: false, message });
		expect(db.Roles.findOne).not.toHaveBeenCalled();
		expect(db.Users.create).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 400 when the role does not exist in the database", async () => {
		db.Roles.findOne.mockResolvedValue(undefined);
		const response = createResponse();

		await CreateUser(
			{
				body: {
					fullname: "Demo Cashier",
					username: "cashier2",
					password: "Cashier123!",
					role: "cashier",
				},
			},
			response,
			vi.fn(),
		);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_BAD_REQUEST,
		);
		expect(db.Users.create).not.toHaveBeenCalled();
	});

	it("returns 409 when the username is already used", async () => {
		db.Users.create.mockRejectedValue({
			name: "SequelizeUniqueConstraintError",
		});
		const response = createResponse();

		await CreateUser(
			{
				body: {
					fullname: "Demo Cashier",
					username: "cashier2",
					password: "Cashier123!",
					role: "cashier",
				},
			},
			response,
			vi.fn(),
		);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_CONFLICT,
		);
		expect(response.json).toHaveBeenCalledWith({
			success: false,
			message: "Username is already in use",
		});
	});

	it("forwards unexpected database errors", async () => {
		const error = new Error("database unavailable");
		db.Users.create.mockRejectedValue(error);
		const response = createResponse();
		const next = vi.fn();

		await CreateUser(
			{
				body: {
					fullname: "Demo Cashier",
					username: "cashier2",
					password: "Cashier123!",
					role: "cashier",
				},
			},
			response,
			next,
		);

		expect(response.status).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(error);
	});
});

describe("getUsers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns users with their roles without password data", async () => {
		const users = [
			{
				id: "7bf0806e-daca-4afa-a2e1-643babe31176",
				fullname: "Demo Cashier",
				username: "cashier2",
				isActive: true,
				createdAt: user.createdAt,
				role: { id: role.id, name: "cashier" },
			},
		];
		db.Users.findAndCountAll.mockResolvedValue({ count: 1, rows: users });
		const response = createResponse();
		const next = vi.fn();

		await getUsers({ query: {} }, response, next);

		expect(db.Users.findAndCountAll).toHaveBeenCalledWith({
			where: {},
			attributes: ["id", "fullname", "username", "isActive", "createdAt"],
			include: [
				{
					model: db.Roles,
					as: "role",
					attributes: ["id", "name"],
				},
			],
			order: [["fullname", "ASC"]],
			limit: 20,
			offset: 0,
			distinct: true,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Users retrieved successfully",
			data: [
				{
					id: users[0].id,
					fullname: users[0].fullname,
					username: users[0].username,
					role: users[0].role,
					is_active: true,
					created_at: user.createdAt,
				},
			],
			meta: {
				pagination: {
					page: 1,
					limit: 20,
					total_items: 1,
					total_pages: 1,
				},
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns API contract pagination metadata", async () => {
		db.Users.findAndCountAll.mockResolvedValue({
			count: 25,
			rows: [user, user, user, user, user],
		});
		const response = createResponse();

		await getUsers({ query: { page: "3", limit: "5" } }, response, vi.fn());

		expect(db.Users.findAndCountAll).toHaveBeenCalledWith(
			expect.objectContaining({ limit: 5, offset: 10 }),
		);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				meta: {
					pagination: {
						page: 3,
						limit: 5,
						total_items: 25,
						total_pages: 5,
					},
				},
			}),
		);
	});

	it("uses API contract query names for search and active status", async () => {
		db.Users.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

		await getUsers(
			{ query: { q: " cashier ", is_active: "false", role: "CASHIER" } },
			createResponse(),
			vi.fn(),
		);

		expect(db.Users.findAndCountAll).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					[Op.or]: [
						{ fullname: { [Op.iLike]: "%cashier%" } },
						{ username: { [Op.iLike]: "%cashier%" } },
					],
					isActive: false,
				},
				include: [
					{
						model: db.Roles,
						as: "role",
						attributes: ["id", "name"],
						where: { name: "cashier" },
						required: true,
					},
				],
			}),
		);
	});

	it("forwards database errors", async () => {
		const error = new Error("database unavailable");
		db.Users.findAndCountAll.mockRejectedValue(error);
		const response = createResponse();
		const next = vi.fn();

		await getUsers({ query: {} }, response, next);

		expect(response.status).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(error);
	});

	it("rejects invalid pagination parameters", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getUsers({ query: { page: "0" } }, response, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "page must be between 1 and 1000000",
			}),
		);
		expect(db.Users.findAndCountAll).not.toHaveBeenCalled();
	});

	it("rejects an invalid is_active filter", async () => {
		const next = vi.fn();

		await getUsers({ query: { is_active: "yes" } }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "is_active must be true or false",
			}),
		);
		expect(db.Users.findAndCountAll).not.toHaveBeenCalled();
	});
});

describe("getUserById", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns a user by id", async () => {
		const userWithRole = { ...user, role };
		db.Users.findByPk.mockResolvedValue(userWithRole);
		const response = createResponse();

		await getUserById({ params: { id: user.id } }, response, vi.fn());

		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "User retrieved successfully",
			data: {
				id: user.id,
				fullname: user.fullname,
				username: user.username,
				role,
				is_active: true,
				created_at: user.createdAt,
			},
		});
	});
});

describe("updateUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("updates a user and returns its latest data", async () => {
		const update = vi.fn();
		const storedUser = { id: user.id, update };
		const updatedUser = { ...user, fullname: "Updated Cashier", role };
		db.Users.findByPk
			.mockResolvedValueOnce(storedUser)
			.mockResolvedValueOnce(updatedUser);
		const response = createResponse();

		await updateUser(
			{ params: { id: user.id }, body: { fullname: "Updated Cashier" } },
			response,
			vi.fn(),
		);

		expect(update).toHaveBeenCalledWith({ fullname: "Updated Cashier" });
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "User updated successfully",
			data: {
				id: user.id,
				fullname: "Updated Cashier",
				username: user.username,
				role,
				is_active: true,
				created_at: user.createdAt,
			},
		});
	});
});

describe("deleteUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("soft deletes a different user", async () => {
		const destroy = vi.fn();
		db.Users.findByPk.mockResolvedValue({ id: user.id, destroy });
		const response = createResponse();

		await deleteUser(
			{ params: { id: user.id }, user: { id: "another-user-id" } },
			response,
			vi.fn(),
		);

		expect(destroy).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "User deleted successfully",
		});
	});
});
