import { describe, expect, it, vi } from "vitest";

import {
	createPaginationMetadata,
	paginate,
	parsePagination,
} from "./pagination.js";

describe("parsePagination", () => {
	it("uses the default pagination values", () => {
		expect(parsePagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
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

describe("createPaginationMetadata", () => {
	it("creates API contract pagination metadata", () => {
		expect(createPaginationMetadata({ count: 25, page: 3, limit: 5 })).toEqual({
			page: 3,
			limit: 5,
			total_items: 25,
			total_pages: 5,
		});
	});

	it("supports grouped Sequelize count results", () => {
		expect(
			createPaginationMetadata({ count: [{}, {}], page: 1, limit: 20 }),
		).toEqual({
			page: 1,
			limit: 20,
			total_items: 2,
			total_pages: 1,
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
			pagination: { page: 2, limit: 2, total_items: 12, total_pages: 6 },
		});
		expect(model.findAndCountAll).toHaveBeenCalledWith({
			where: { active: true },
			limit: 2,
			offset: 2,
		});
	});
});
