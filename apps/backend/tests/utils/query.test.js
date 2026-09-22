import { describe, expect, it } from "vitest";

import { parseBoolean, parseSearch } from "../../src/utils/query.js";

describe("parseBoolean", () => {
	it("parses boolean query-string values", () => {
		expect(parseBoolean("true")).toBe(true);
		expect(parseBoolean("false")).toBe(false);
	});

	it("returns undefined for unsupported values", () => {
		expect(parseBoolean(undefined)).toBeUndefined();
		expect(parseBoolean("yes")).toBeUndefined();
		expect(parseBoolean(true)).toBeUndefined();
	});
});

describe("parseSearch", () => {
	it("trims a string query", () => {
		expect(parseSearch("  Galaxy A55  ")).toBe("Galaxy A55");
	});

	it("returns an empty string for non-string values", () => {
		expect(parseSearch(undefined)).toBe("");
		expect(parseSearch(["Galaxy"])).toBe("");
	});
});
