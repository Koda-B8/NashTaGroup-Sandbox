import { constants } from "node:http2";

import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import { CreateUser, getUsers } from "./user.controller.js";

vi.mock("../models/index.cjs", () => ({
	default: {
		Roles: { findOne: vi.fn() },
		Users: { create: vi.fn(), findAndCountAll: vi.fn() },
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
				isActive: true,
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
					isActive: false,
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
				role: { id: role.id, name: "cashier" },
			},
		];
		db.Users.findAndCountAll.mockResolvedValue({ count: 1, rows: users });
		const response = createResponse();
		const next = vi.fn();

		await getUsers({ query: {} }, response, next);

		expect(db.Users.findAndCountAll).toHaveBeenCalledWith({
			attributes: ["id", "fullname", "username", "isActive", "createdAt"],
			include: [
				{
					model: db.Roles,
					as: "role",
					attributes: ["id", "name"],
				},
			],
			order: [["fullname", "ASC"]],
			limit: 10,
			offset: 0,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Users retrieved successfully",
			data: [
				{
					...users[0],
					cashierId: users[0].id,
				},
			],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("applies page and limit from the query string", async () => {
		db.Users.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });
		const response = createResponse();

		await getUsers({ query: { page: "3", limit: "5" } }, response, vi.fn());

		expect(db.Users.findAndCountAll).toHaveBeenCalledWith(
			expect.objectContaining({ limit: 5, offset: 10 }),
		);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				pagination: { page: 3, limit: 5, total: 25, totalPages: 5 },
			}),
		);
	});

	it.each([
		[{ page: "0" }, "page must be a positive integer"],
		[{ page: "abc" }, "page must be a positive integer"],
		[{ limit: "0" }, "limit must be an integer between 1 and 100"],
		[{ limit: "101" }, "limit must be an integer between 1 and 100"],
		[{ limit: "2.5" }, "limit must be an integer between 1 and 100"],
	])("rejects invalid pagination %o", async (query, message) => {
		const response = createResponse();
		const next = vi.fn();

		await getUsers({ query }, response, next);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_BAD_REQUEST,
		);
		expect(response.json).toHaveBeenCalledWith({ success: false, message });
		expect(db.Users.findAndCountAll).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
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
});
