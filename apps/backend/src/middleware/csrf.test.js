import { describe, expect, it, vi } from "vitest";

import csrfProtection from "./csrf.js";

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("csrfProtection middleware", () => {
	it("allows safe requests without a CSRF token", () => {
		const request = {
			method: "GET",
			path: "/products",
			cookies: {},
			get: vi.fn(),
		};
		const response = createResponse();
		const next = vi.fn();

		csrfProtection(request, response, next);

		expect(next).toHaveBeenCalledOnce();
		expect(response.status).not.toHaveBeenCalled();
	});

	it("allows the login request without a CSRF token", () => {
		const request = {
			method: "POST",
			path: "/auth/login",
			cookies: {},
			get: vi.fn(),
		};
		const response = createResponse();
		const next = vi.fn();

		csrfProtection(request, response, next);

		expect(next).toHaveBeenCalledOnce();
		expect(response.status).not.toHaveBeenCalled();
	});

	it("allows bearer-token requests without an authentication cookie", () => {
		const request = {
			method: "POST",
			path: "/products",
			cookies: {},
			get: vi.fn(),
		};
		const response = createResponse();
		const next = vi.fn();

		csrfProtection(request, response, next);

		expect(next).toHaveBeenCalledOnce();
		expect(response.status).not.toHaveBeenCalled();
	});

	it("rejects a cookie-authenticated write request without a CSRF token", () => {
		const request = {
			method: "POST",
			path: "/products",
			cookies: { auth_token: "jwt-cookie-token" },
			get: vi.fn().mockReturnValue(undefined),
		};
		const response = createResponse();
		const next = vi.fn();

		csrfProtection(request, response, next);

		expect(next).not.toHaveBeenCalled();
		expect(response.status).toHaveBeenCalledWith(403);
		expect(response.json).toHaveBeenCalledWith({
			success: false,
			message: "Invalid or missing CSRF token",
		});
	});

	it("allows a cookie-authenticated write request with matching CSRF tokens", () => {
		const request = {
			method: "PATCH",
			path: "/products/product-id",
			cookies: {
				auth_token: "jwt-cookie-token",
				csrf_token: "valid-csrf-token",
			},
			get: vi.fn().mockReturnValue("valid-csrf-token"),
		};
		const response = createResponse();
		const next = vi.fn();

		csrfProtection(request, response, next);

		expect(next).toHaveBeenCalledOnce();
		expect(response.status).not.toHaveBeenCalled();
	});

	it("rejects a cookie-authenticated write request with different CSRF tokens", () => {
		const request = {
			method: "DELETE",
			path: "/products/product-id",
			cookies: {
				auth_token: "jwt-cookie-token",
				csrf_token: "valid-csrf-token",
			},
			get: vi.fn().mockReturnValue("different-csrf-token"),
		};
		const response = createResponse();
		const next = vi.fn();

		csrfProtection(request, response, next);

		expect(next).not.toHaveBeenCalled();
		expect(response.status).toHaveBeenCalledWith(403);
		expect(response.json).toHaveBeenCalledWith({
			success: false,
			message: "Invalid or missing CSRF token",
		});
	});
});
