import { constants } from "node:http2";

import argon2 from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login } from "../../../controllers/auth.controller.js";
import { signToken } from "../../../lib/jwt.js";
import db from "../../../models/index.cjs";

vi.mock("argon2", () => ({
	default: { verify: vi.fn() },
}));

vi.mock("../../../lib/jwt.js", () => ({
	signToken: vi.fn(),
}));

vi.mock("../../../models/index.cjs", () => ({
	default: {
		Roles: {},
		Users: { scope: vi.fn() },
	},
}));

const user = {
	id: "7bf0806e-daca-4afa-a2e1-643babe31176",
	fullname: "Demo Cashier",
	password: "$argon2id$hashed-password",
	isActive: true,
	role: { name: "cashier" },
};

const createResponse = () => ({
	cookie: vi.fn(),
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("auth controller login", () => {
	let findOne;

	beforeEach(() => {
		vi.clearAllMocks();
		findOne = vi.fn().mockResolvedValue(user);
		db.Users.scope.mockReturnValue({ findOne });
		vi.mocked(argon2.verify).mockResolvedValue(true);
		vi.mocked(signToken).mockReturnValue("signed-access-token");
	});

	it("sets an HttpOnly cookie and returns user data for valid credentials", async () => {
		const request = {
			body: { username: " cashier ", password: "Cashier123!" },
		};
		const response = createResponse();

		await login(request, response);

		expect(db.Users.scope).toHaveBeenCalledWith("withPassword");
		expect(findOne).toHaveBeenCalledWith({
			where: { username: "cashier" },
			include: [
				{ model: db.Roles, as: "role", attributes: ["name"], required: true },
			],
		});
		expect(argon2.verify).toHaveBeenCalledWith(user.password, "Cashier123!");
		expect(signToken).toHaveBeenCalledWith({
			userId: user.id,
			userRole: "cashier",
		});
		expect(response.cookie).toHaveBeenCalledWith(
			"auth_token",
			"signed-access-token",
			{
				httpOnly: true,
				secure: false,
				sameSite: "lax",
				maxAge: 24 * 60 * 60 * 1000,
				path: "/",
			},
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Login successfully",
			data: { id: user.id, fullname: user.fullname, role: "cashier" },
		});
	});

	it.each([
		{},
		{ username: "cashier" },
		{ password: "Cashier123!" },
		{ username: "   ", password: "Cashier123!" },
	])("returns 400 for invalid payload %#", async (body) => {
		const response = createResponse();

		await login({ body }, response);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_BAD_REQUEST,
		);
		expect(response.json).toHaveBeenCalledWith({
			success: false,
			message: "Username or password required",
		});
		expect(findOne).not.toHaveBeenCalled();
	});

	it("returns 401 when the user does not exist", async () => {
		findOne.mockResolvedValue(undefined);
		const response = createResponse();

		await login(
			{ body: { username: "unknown", password: "Wrong123!" } },
			response,
		);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_UNAUTHORIZED,
		);
		expect(response.json).toHaveBeenCalledWith({
			success: false,
			message: "Invalid username or password",
		});
	});

	it("returns 401 when the password is wrong", async () => {
		vi.mocked(argon2.verify).mockResolvedValue(false);
		const response = createResponse();

		await login({ body: { username: "cashier", password: "wrong" } }, response);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_UNAUTHORIZED,
		);
		expect(signToken).not.toHaveBeenCalled();
	});

	it("returns 401 when the user is inactive", async () => {
		findOne.mockResolvedValue({ ...user, isActive: false });
		const response = createResponse();

		await login(
			{ body: { username: "cashier", password: "Cashier123!" } },
			response,
		);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_UNAUTHORIZED,
		);
		expect(argon2.verify).not.toHaveBeenCalled();
	});

	it("returns 500 when an unexpected error occurs", async () => {
		findOne.mockRejectedValue(new Error("database unavailable"));
		const response = createResponse();

		await login(
			{ body: { username: "cashier", password: "Cashier123!" } },
			response,
		);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
		);
		expect(response.json).toHaveBeenCalledWith({
			success: false,
			message: "Internal server error",
		});
	});
});
