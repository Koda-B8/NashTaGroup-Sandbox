import { describe, expect, it } from "vitest";

import reportRoute from "../src/routes/ReportRoute.js";

const firstMatchingRoute = (path) =>
	reportRoute.stack.find((layer) => layer.route && layer.match(path))?.route
		.path;

describe("report route matching", () => {
	it.each(["customers", "products"])(
		"routes /%s/export to the general export handler before the ID route",
		(report) => {
			expect(firstMatchingRoute(`/${report}/export`)).toBe("/:report/export");
		},
	);

	it.each(["customers", "products"])(
		"still routes /%s/:id to its detail handler",
		(report) => {
			const id = "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0";
			expect(firstMatchingRoute(`/${report}/${id}`)).toBe(
				`/${report}/:${report === "customers" ? "customerId" : "productId"}`,
			);
		},
	);

	it.each(["customers", "products"])(
		"still routes /%s/:id/export to its detail export handler",
		(report) => {
			const id = "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0";
			expect(firstMatchingRoute(`/${report}/${id}/export`)).toBe(
				`/${report}/:${report === "customers" ? "customerId" : "productId"}/export`,
			);
		},
	);
});
