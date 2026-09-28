import { describe, expect, it } from "vitest";

import { parseSorting } from "../../src/lib/sorting.js";

const options = new Map([
	["name_asc", [["name", "ASC"]]],
	["name_desc", [["name", "DESC"]]],
]);

describe("parseSorting", () => {
	it("uses the configured default sort", () => {
		expect(
			parseSorting(
				{},
				{
					defaultSort: "name_asc",
					options,
					message: "sort is invalid",
				},
			),
		).toEqual({ sort: "name_asc", order: [["name", "ASC"]] });
	});

	it("returns the requested whitelisted sort", () => {
		expect(
			parseSorting(
				{ sort: "name_desc" },
				{
					defaultSort: "name_asc",
					options,
					message: "sort is invalid",
				},
			),
		).toEqual({ sort: "name_desc", order: [["name", "DESC"]] });
	});

	it("rejects invalid sort values with a bad request error", () => {
		expect(() =>
			parseSorting(
				{ sort: "created_at_desc" },
				{
					defaultSort: "name_asc",
					options,
					message: "sort is invalid",
				},
			),
		).toThrow("sort is invalid");

		try {
			parseSorting(
				{ sort: "created_at_desc" },
				{
					defaultSort: "name_asc",
					options,
					message: "sort is invalid",
				},
			);
		} catch (error) {
			expect(error.statusCode).toBe(400);
		}
	});
});
