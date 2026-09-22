import { describe, expect, it } from "vitest";

import db from "../../src/models/index.cjs";

describe("model associations", () => {
	it("loads all models with a single attributeValues association on ProductItems", () => {
		const association = db.ProductItems.associations.attributeValues;
		expect(association).toBeDefined();
		expect(association.associationType).toBe("HasMany");
		expect(association.target).toBe(db.ProductItemAttributeValues);
	});
});
