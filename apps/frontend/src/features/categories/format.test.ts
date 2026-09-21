import { describe, expect, it } from "vitest";

import { buildCategoryStats } from "./format";

const page = [
	{ isActive: true, updatedAt: "2026-01-02" },
	{ isActive: true, updatedAt: "2026-01-03" },
];

describe("buildCategoryStats", () => {
	it("uses server counts instead of the current page", () => {
		const stats = buildCategoryStats(page, { total: 20, active: 15 });
		expect(stats).toMatchObject({
			total: 20,
			active: 15,
			inactive: 5,
			activeRate: 75,
		});
	});

	it("falls back to the page when counts are unavailable", () => {
		expect(buildCategoryStats(page, null)).toMatchObject({
			total: 2,
			active: 2,
			inactive: 0,
			activeRate: 100,
		});
	});

	it("picks the most recently updated item as best", () => {
		expect(buildCategoryStats(page, null).best?.updatedAt).toBe("2026-01-03");
	});

	it("reports a zero rate for an empty set", () => {
		expect(buildCategoryStats([], null)).toMatchObject({
			total: 0,
			activeRate: 0,
			best: null,
		});
	});
});
