import { beforeEach, describe, expect, it, vi } from "vitest";

import { invalidateListCache } from "../../src/lib/list-cache.js";
import listCacheInvalidation, {
	listScopesForWrite,
} from "../../src/middleware/list-cache-invalidation.js";

vi.mock("../../src/lib/list-cache.js", () => ({
	invalidateListCache: vi.fn(),
}));

const createResponse = (statusCode = 200) => {
	const response = {
		statusCode,
		json: vi.fn(() => response),
	};
	response.sendJson = response.json;
	return response;
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(invalidateListCache).mockResolvedValue();
});

describe("list cache invalidation", () => {
	it.each([
		["POST", "/products", ["products"]],
		["PATCH", "/product-items/123", ["products"]],
		["PUT", "/product-images/123/primary", ["products"]],
		["POST", "/inventories/123/adjustments", ["products"]],
		["POST", "/checkout", ["products", "customers"]],
		["PATCH", "/categories/123", ["products", "categories"]],
		["DELETE", "/brands/123", ["products", "brands"]],
		["POST", "/users", ["users"]],
	])(
		"invalidates before responding for successful %s %s",
		async (method, path, scopes) => {
			const response = createResponse();
			const next = vi.fn();
			listCacheInvalidation({ method, path }, response, next);
			expect(next).toHaveBeenCalledOnce();

			const body = { success: true };
			await response.json(body);

			expect(vi.mocked(invalidateListCache).mock.calls).toEqual(
				scopes.map((scope) => [scope]),
			);
			// The original response body still goes out untouched.
			expect(response.sendJson).toHaveBeenCalledWith(body);
		},
	);

	it("waits for the version bump before sending the response", async () => {
		let resolveInvalidation;
		vi.mocked(invalidateListCache).mockReturnValue(
			new Promise((resolve) => {
				resolveInvalidation = resolve;
			}),
		);

		// Wrap json before the middleware runs, since it captures the method.
		const sent = vi.fn();
		const response = createResponse();
		const originalJson = response.json;
		response.json = (body) => {
			sent();
			return originalJson(body);
		};

		listCacheInvalidation(
			{ method: "POST", path: "/products" },
			response,
			vi.fn(),
		);

		const pending = response.json({ success: true });
		// The response must not be sent while invalidation is still in flight.
		await Promise.resolve();
		expect(sent).not.toHaveBeenCalled();

		resolveInvalidation();
		await pending;
		expect(sent).toHaveBeenCalledOnce();
	});

	it("does not invalidate for failed writes, reads, or unrelated paths", async () => {
		const failed = createResponse(400);
		listCacheInvalidation(
			{ method: "POST", path: "/products" },
			failed,
			vi.fn(),
		);
		await failed.json({ success: false });
		expect(invalidateListCache).not.toHaveBeenCalled();

		expect(listScopesForWrite("GET", "/products")).toEqual([]);
		expect(listScopesForWrite("POST", "/auth/login")).toEqual([]);

		const read = createResponse();
		listCacheInvalidation({ method: "GET", path: "/products" }, read, vi.fn());
		await read.json({ success: true });
		expect(invalidateListCache).not.toHaveBeenCalled();
	});
});
