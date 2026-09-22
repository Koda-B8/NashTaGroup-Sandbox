import { describe, expect, it } from "vitest";

import { createHttpError, HttpError } from "../../src/utils/http-error.js";

describe("createHttpError", () => {
	it("creates an error with an HTTP status code", () => {
		const error = createHttpError(404, "Not found");

		expect(error).toBeInstanceOf(HttpError);
		expect(error.message).toBe("Not found");
		expect(error.statusCode).toBe(404);
	});
});
