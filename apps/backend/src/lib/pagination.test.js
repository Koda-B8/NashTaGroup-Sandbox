import { describe, expect, it, vi } from "vitest";

import { createPageMetadata, paginate, parsePagination } from "./pagination.js";

describe("parsePagination", () => {
	it("uses the default pagination values", () => {
		expect(parsePagination({})).toEqual({ page: 1, limit: 10, offset: 0 });
	});

	it("calculates the offset from page and limit", () => {
		expect(parsePagination({ page: "3", limit: "5" })).toEqual({
			page: 3,
			limit: 5,
			offset: 10,
		});
	});

	it("supports custom defaults and limits", () => {
		expect(parsePagination({}, { defaultPage: 2, defaultLimit: 25 })).toEqual({
			page: 2,
			limit: 25,
			offset: 25,
		});
	});

	it.each([
		[{ page: "0" }, "page must be between 1 and 1000000"],
		[{ page: "one" }, "page must be a positive integer"],
		[{ limit: "101" }, "limit must be between 1 and 100"],
	])("rejects invalid query values", (query, message) => {
		expect(() => parsePagination(query)).toThrow(message);

		try {
			parsePagination(query);
		} catch (error) {
			expect(error.statusCode).toBe(400);
		}
	});
});

describe("createPageMetadata", () => {
	it("creates navigation metadata", () => {
		expect(
			createPageMetadata({ count: 25, rowCount: 5, page: 3, limit: 5 }),
		).toEqual({ total: 25, count: 5, current: 3, next: 4, prev: 2 });
	});

	it("supports grouped Sequelize count results", () => {
		expect(
			createPageMetadata({ count: [{}, {}], rowCount: 2, page: 1, limit: 10 }),
		).toEqual({
			total: 2,
			count: 2,
			current: 1,
			next: undefined,
			prev: undefined,
		});
	});
});

describe("paginate", () => {
	it("can paginate any model with findAndCountAll", async () => {
		const rows = [{ id: 1 }, { id: 2 }];
		const model = {
			findAndCountAll: vi.fn().mockResolvedValue({ count: 12, rows }),
		};

		await expect(
			paginate(model, { page: "2", limit: "2" }, { where: { active: true } }),
		).resolves.toEqual({
			rows,
			page: { total: 12, count: 2, current: 2, next: 3, prev: 1 },
		});
		expect(model.findAndCountAll).toHaveBeenCalledWith({
			where: { active: true },
			limit: 2,
			offset: 2,
		});
	});
});
