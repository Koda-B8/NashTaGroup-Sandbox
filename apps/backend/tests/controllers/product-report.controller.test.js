import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProductDetailReport } from "../../src/controllers/product-report.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: { sequelize: { query: vi.fn() } },
}));

const PRODUCT_ID = "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0";
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

beforeEach(() => vi.clearAllMocks());

describe("product master report", () => {
	it.each(["transactions", "customers", "cashiers"])(
		"scopes the %s view to one product and completed transactions",
		async (view) => {
			vi.mocked(db.sequelize.query)
				.mockResolvedValueOnce([{ id: PRODUCT_ID, name: "iPhone 15" }])
				.mockResolvedValueOnce([
					{ transaction_count: 3, units_sold: 4, gross_sales: "400000.00" },
				])
				.mockResolvedValueOnce([{ total: 2 }])
				.mockResolvedValueOnce([
					{ transaction_count: 2, gross_sales: "300000.00" },
				]);
			const res = response();
			const next = vi.fn();
			await getProductDetailReport(
				{
					params: { productId: PRODUCT_ID },
					query: {
						view,
						from: "2026-09-01",
						to: "2026-09-30",
						page: "2",
						limit: "1",
					},
				},
				res,
				next,
			);
			expect(next).not.toHaveBeenCalled();
			const body = res.json.mock.calls[0][0];
			expect(body.data.product.name).toBe("iPhone 15");
			expect(body.data.summary.transaction_count).toBe(3);
			expect(body.data[view]).toHaveLength(1);
			expect(body.meta.pagination).toEqual({
				page: 2,
				limit: 1,
				total_items: 2,
				total_pages: 2,
			});
			const calls = vi.mocked(db.sequelize.query).mock.calls;
			for (const call of calls.slice(1)) {
				expect(call[0]).toContain("pi.product_id = :productId");
				expect(call[0]).toContain("t.status = 'completed'");
				expect(call[1].replacements).toMatchObject({
					productId: PRODUCT_ID,
					from: "2026-09-01",
					toExclusive: "2026-10-01",
					offset: 1,
				});
			}
			expect(calls[3][0]).toMatch(/JOIN product_items pi[\s\S]*WHERE t.status/);
			if (view === "customers") {
				expect(calls[3][0]).toContain("LEFT JOIN customers c");
			} else {
				expect(calls[3][0]).toContain("JOIN users u");
			}
		},
	);

	it("returns 404 for an unknown product master", async () => {
		vi.mocked(db.sequelize.query).mockResolvedValueOnce([]);
		const next = vi.fn();
		await getProductDetailReport(
			{ params: { productId: PRODUCT_ID }, query: {} },
			response(),
			next,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 404 }),
		);
		expect(db.sequelize.query).toHaveBeenCalledTimes(1);
	});

	it.each([
		{ productId: "invalid", query: {} },
		{ productId: PRODUCT_ID, query: { view: "inventory" } },
		{ productId: PRODUCT_ID, query: { from: "2026-02-30" } },
	])(
		"rejects invalid input before querying: %j",
		async ({ productId, query }) => {
			const next = vi.fn();
			await getProductDetailReport(
				{ params: { productId }, query },
				response(),
				next,
			);
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({ statusCode: 400 }),
			);
			expect(db.sequelize.query).not.toHaveBeenCalled();
		},
	);
});
