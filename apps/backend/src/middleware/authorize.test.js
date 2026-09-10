import { constants } from "node:http2";

import { describe, expect, it, vi } from "vitest";

import { requireRole } from "./middleware/authorize.js";

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("requireRole middleware", () => {
	it("continues when the authenticated user has an allowed role", () => {
		const response = createResponse();
		const next = vi.fn();

		requireRole("admin")({ user: { role: "admin" } }, response, next);

		expect(next).toHaveBeenCalledOnce();
		expect(response.status).not.toHaveBeenCalled();
	});

	it.each(["admin", "cashier"])(
		"supports endpoints shared by admin and cashier (%s)",
		(role) => {
			const response = createResponse();
			const next = vi.fn();

			requireRole("admin", "cashier")({ user: { role } }, response, next);

			expect(next).toHaveBeenCalledOnce();
			expect(response.status).not.toHaveBeenCalled();
		},
	);

	it.each([undefined, { role: "cashier" }])(
		"returns 403 when the role is not allowed",
		(user) => {
			const response = createResponse();
			const next = vi.fn();

			requireRole("admin")({ user }, response, next);

			expect(response.status).toHaveBeenCalledWith(
				constants.HTTP_STATUS_FORBIDDEN,
			);
			expect(response.json).toHaveBeenCalledWith({
				success: false,
				message: "Forbidden: insufficient permissions",
			});
			expect(next).not.toHaveBeenCalled();
		},
	);
});
