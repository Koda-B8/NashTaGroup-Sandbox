import { EventEmitter } from "node:events";
// oxlint-disable unicorn/prefer-event-target -- Express responses use EventEmitter.

import { beforeEach, describe, expect, it, vi } from "vitest";

import { invalidateListCache } from "../../src/lib/list-cache.js";
import listCacheInvalidation, {
	listScopesForWrite,
} from "../../src/middleware/list-cache-invalidation.js";

vi.mock("../../src/lib/list-cache.js", () => ({
	invalidateListCache: vi.fn(),
}));

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
	])("invalidates after successful %s %s", (method, path, scopes) => {
		const response = Object.assign(new EventEmitter(), { statusCode: 200 });
		const next = vi.fn();
		listCacheInvalidation({ method, path }, response, next);
		response.emit("finish");
		expect(next).toHaveBeenCalledOnce();
		expect(vi.mocked(invalidateListCache).mock.calls).toEqual(
			scopes.map((scope) => [scope]),
		);
	});

	it("does not invalidate for failed writes, reads, or unrelated paths", () => {
		const failed = Object.assign(new EventEmitter(), { statusCode: 400 });
		listCacheInvalidation(
			{ method: "POST", path: "/products" },
			failed,
			vi.fn(),
		);
		failed.emit("finish");
		expect(listScopesForWrite("GET", "/products")).toEqual([]);
		expect(listScopesForWrite("POST", "/auth/login")).toEqual([]);
		expect(invalidateListCache).not.toHaveBeenCalled();
	});
});
