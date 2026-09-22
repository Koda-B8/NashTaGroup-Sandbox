import { describe, expect, it } from "vitest";

import { isUuid, normalizeText } from "../../src/utils/validation.js";

describe("isUuid", () => {
	it("recognizes valid UUIDs", () => {
		expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
	});

	it("rejects invalid UUID values", () => {
		expect(isUuid("not-a-uuid")).toBe(false);
		expect(isUuid(123)).toBe(false);
	});
});

describe("normalizeText", () => {
	it("trims and collapses whitespace", () => {
		expect(normalizeText("  Product   Name  ")).toBe("Product Name");
		expect(normalizeText(undefined)).toBe("");
	});
});
