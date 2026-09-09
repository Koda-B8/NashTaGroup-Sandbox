import { constants } from "node:http2";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyToken } from "../../../lib/jwt.js";
import authMiddleware from "../../../middleware/auth.js";
import db from "../../../models/index.cjs";

vi.mock("../../../lib/jwt.js", () => ({
	verifyToken: vi.fn(),
}));

vi.mock("../../../models/index.cjs", () => ({
	default: {
		Roles: {},
		Users: { findByPk: vi.fn() },
	},
}));

const user = {
	id: "7bf0806e-daca-4afa-a2e1-643babe31176",
	username: "cashier",
	fullname: "Demo Cashier",
	isActive: true,
	role: { name: "cashier" },
};

const createRequest = (authorization, cookies = {}) => ({
	cookies,
	header: vi.fn().mockReturnValue(authorization),
});

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("auth middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(verifyToken).mockReturnValue({ userId: user.id });
		db.Users.findByPk.mockResolvedValue(user);
	});

	it.each([undefined, "", "Basic credentials", "Bearer", "Bearer token extra"])(
		"returns 401 when the authorization header is invalid (%s)",
		async (authorization) => {
			const response = createResponse();
			const next = vi.fn();

			await authMiddleware(createRequest(authorization), response, next);

			expect(response.status).toHaveBeenCalledWith(
				constants.HTTP_STATUS_UNAUTHORIZED,
			);
			expect(response.json).toHaveBeenCalledWith({
				success: false,
				message: "Unauthorized: token tidak ditemukan",
			});
			expect(verifyToken).not.toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		},
	);

	it("returns 401 when token verification fails", async () => {
		vi.mocked(verifyToken).mockImplementation(() => {
			throw new Error("invalid token");
		});
		const response = createResponse();
		const next = vi.fn();

		await authMiddleware(createRequest("Bearer invalid"), response, next);

		expect(response.status).toHaveBeenCalledWith(
			constants.HTTP_STATUS_UNAUTHORIZED,
		);
		expect(db.Users.findByPk).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it.each(["unexpected payload", {}, { userId: "" }])(
		"returns 401 when the token payload is invalid (%s)",
		async (payload) => {
			vi.mocked(verifyToken).mockReturnValue(payload);
			const response = createResponse();
			const next = vi.fn();

			await authMiddleware(createRequest("Bearer token"), response, next);

			expect(response.status).toHaveBeenCalledWith(
				constants.HTTP_STATUS_UNAUTHORIZED,
			);
			expect(db.Users.findByPk).not.toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		},
	);

	it("loads the current user and continues for a valid token", async () => {
		const request = createRequest("bearer token");
		const response = createResponse();
		const next = vi.fn();

		await authMiddleware(request, response, next);

		expect(verifyToken).toHaveBeenCalledWith("token");
		expect(db.Users.findByPk).toHaveBeenCalledWith(user.id, {
			include: [
				{
					model: db.Roles,
					as: "role",
					attributes: ["name"],
					required: true,
				},
			],
		});
		expect(request.user).toEqual({
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			role: "cashier",
		});
		expect(response.status).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith();
	});

	it("uses the authentication cookie before the authorization header", async () => {
		const request = createRequest("Bearer header-token", {
			auth_token: "cookie-token",
		});
		const response = createResponse();
		const next = vi.fn();

		await authMiddleware(request, response, next);

		expect(verifyToken).toHaveBeenCalledWith("cookie-token");
		expect(request.header).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledOnce();
	});

	it.each([
		undefined,
		{ ...user, isActive: false },
		{ ...user, role: undefined },
	])(
		"returns 401 when the database user cannot authenticate",
		async (databaseUser) => {
			db.Users.findByPk.mockResolvedValue(databaseUser);
			const response = createResponse();
			const next = vi.fn();

			await authMiddleware(createRequest("Bearer token"), response, next);

			expect(response.status).toHaveBeenCalledWith(
				constants.HTTP_STATUS_UNAUTHORIZED,
			);
			expect(next).not.toHaveBeenCalled();
		},
	);

	it("forwards database failures to the error handler", async () => {
		const error = new Error("database unavailable");
		db.Users.findByPk.mockRejectedValue(error);
		const response = createResponse();
		const next = vi.fn();

		await authMiddleware(createRequest("Bearer token"), response, next);

		expect(response.status).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(error);
	});
});
