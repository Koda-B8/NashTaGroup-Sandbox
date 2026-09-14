import { describe, expect, it } from "vitest";

import { parseBoolean } from "./query.js";

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
