import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	invalidateListCache,
	listCacheKey,
	readListCache,
	writeListCache,
} from "../../src/lib/list-cache.js";
import {
	invalidateProductListCache,
	productListCacheKey,
	readProductListCache,
	writeProductListCache,
} from "../../src/lib/product-list-cache.js";
import { runRedis } from "../../src/lib/redis-client.js";

vi.mock("../../src/lib/redis-client.js", () => ({ runRedis: vi.fn() }));

const values = new Map();
const client = {
	get: vi.fn(async (key) => values.get(key) ?? undefined),
	set: vi.fn(async (key, value) => {
		values.set(key, value);
		return "OK";
	}),
	incr: vi.fn(async (key) => {
		const next = Number(values.get(key) ?? 0) + 1;
		values.set(key, String(next));
		return next;
	}),
};

beforeEach(() => {
	values.clear();
	vi.clearAllMocks();
	vi.mocked(runRedis).mockImplementation(async (operation) => ({
		ok: true,
		value: await operation(client),
	}));
});

describe("product list cache", () => {
	it("separates filters and invalidates cached lists after a write", async () => {
		const filters = { search: "phone", page: 1, limit: 20 };
		const key = await productListCacheKey(filters);
		const otherKey = await productListCacheKey({ ...filters, page: 2 });
		expect(otherKey).not.toBe(key);
		const body = { success: true, data: [{ name: "Phone" }] };
		await writeProductListCache(key, body);
		expect(await readProductListCache(key)).toEqual(body);
		expect(client.set).toHaveBeenCalledWith(key, JSON.stringify(body), {
			EX: 30,
		});
		await invalidateProductListCache();
		expect(await productListCacheKey(filters)).not.toBe(key);
	});

	it("falls back when Redis is unavailable", async () => {
		vi.mocked(runRedis).mockResolvedValue({ ok: false });
		expect(await productListCacheKey({ page: 1 })).toBeUndefined();
		expect(await readProductListCache("some-key")).toBeUndefined();
		await expect(
			writeProductListCache("some-key", {}),
		).resolves.toBeUndefined();
	});
});

describe("shared list cache", () => {
	it("keeps customer, user, brand, and category entries independent", async () => {
		const scopes = ["customers", "users", "brands", "categories"];
		const keys = await Promise.all(
			scopes.map((scope) => listCacheKey(scope, { page: 1 })),
		);
		expect(new Set(keys).size).toBe(scopes.length);
		await Promise.all(
			keys.map((key, index) => writeListCache(key, { scope: scopes[index] })),
		);
		for (const [index, key] of keys.entries()) {
			expect(await readListCache(key)).toEqual({ scope: scopes[index] });
		}
		await invalidateListCache("customers");
		expect(await listCacheKey("customers", { page: 1 })).not.toBe(keys[0]);
		expect(await listCacheKey("users", { page: 1 })).toBe(keys[1]);
	});
});
