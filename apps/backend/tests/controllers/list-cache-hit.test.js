import { beforeEach, describe, expect, it, vi } from "vitest";

import { getBrands } from "../../src/controllers/brand.controller.js";
import { getCategories } from "../../src/controllers/category.controller.js";
import { getCustomers } from "../../src/controllers/customer.controller.js";
import { getCachedCustomerReport } from "../../src/controllers/report.controller.js";
import { getUsers } from "../../src/controllers/user.controller.js";
import { listCacheKey, readListCache } from "../../src/lib/list-cache.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/lib/list-cache.js", () => ({
	listCacheKey: vi.fn(),
	readListCache: vi.fn(),
	writeListCache: vi.fn(),
}));
vi.mock("../../src/models/index.cjs", () => ({
	default: {
		Brands: { findAll: vi.fn() },
		Categories: { findAll: vi.fn() },
		Customers: { findAndCountAll: vi.fn() },
		Users: { findAndCountAll: vi.fn() },
		Roles: {},
		sequelize: { query: vi.fn() },
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(listCacheKey).mockResolvedValue("cached-key");
	vi.mocked(readListCache).mockResolvedValue({ success: true, data: [] });
});

describe("list controller cache hits", () => {
	it.each([
		["users", getUsers, "findAndCountAll"],
		["brands", getBrands, "findAll"],
		["categories", getCategories, "findAll"],
		["customers", getCustomers, "findAndCountAll"],
	])(
		"serves %s without a database query",
		async (scope, handler, queryMethod) => {
			const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
			const next = vi.fn();
			await handler({ query: {} }, response, next);
			expect(listCacheKey).toHaveBeenCalledWith(scope, expect.any(Object));
			expect(response.json).toHaveBeenCalledWith({ success: true, data: [] });
			expect(
				db[scope[0].toUpperCase() + scope.slice(1)][queryMethod],
			).not.toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		},
	);

	it("serves the customer list without querying the report and uses normalized filters", async () => {
		const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
		const next = vi.fn();
		await getCachedCustomerReport(
			{ query: { from: "2026-09-01", page: "2" } },
			response,
			next,
		);
		expect(listCacheKey).toHaveBeenCalledWith(
			"customers",
			expect.objectContaining({ from: "2026-09-01", page: 2, limit: 20 }),
		);
		expect(response.json).toHaveBeenCalledWith({ success: true, data: [] });
		expect(db.sequelize.query).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});
});
