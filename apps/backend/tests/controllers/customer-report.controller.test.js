import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCustomerDetailReport } from "../../src/controllers/customer-report.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: { sequelize: { query: vi.fn() } },
}));

const CUSTOMER_ID = "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0";
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

beforeEach(() => vi.clearAllMocks());

describe("customer detail report", () => {
	it.each(["transactions", "products", "cashiers"])(
		"returns the %s view scoped to one customer",
		async (view) => {
			vi.mocked(db.sequelize.query)
				.mockResolvedValueOnce([
					{ id: CUSTOMER_ID, name: "Budi", phone: "0812345" },
				])
				.mockResolvedValueOnce([
					{ transaction_count: 3, total_sales: "300000.00" },
				])
				.mockResolvedValueOnce([{ total: 2 }])
				.mockResolvedValueOnce([
					{ transaction_count: 2, total_sales: "200000.00" },
				]);
			const res = response();
			const next = vi.fn();
			await getCustomerDetailReport(
				{
					params: { customerId: CUSTOMER_ID },
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
			expect(body.data.customer.name).toBe("Budi");
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
				expect(call[0]).toContain("t.customer_id = :customerId");
				expect(call[0]).toContain("t.status = 'completed'");
				expect(call[1].replacements).toMatchObject({
					customerId: CUSTOMER_ID,
					from: "2026-09-01",
					toExclusive: "2026-10-01",
					offset: 1,
				});
			}
			if (view === "products") {
				expect(calls[3][0]).toMatch(/JOIN products p[\s\S]*WHERE t.status/);
			} else {
				expect(calls[3][0]).toMatch(/JOIN users u[\s\S]*WHERE t.status/);
			}
		},
	);

	it("returns an empty list and zero pages for a customer with no completed transactions", async () => {
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([{ id: CUSTOMER_ID, name: "Budi" }])
			.mockResolvedValueOnce([{ transaction_count: 0, total_sales: "0" }])
			.mockResolvedValueOnce([{ total: 0 }])
			.mockResolvedValueOnce([]);
		const res = response();
		await getCustomerDetailReport(
			{ params: { customerId: CUSTOMER_ID }, query: {} },
			res,
			vi.fn(),
		);
		const body = res.json.mock.calls[0][0];
		expect(body.data.transactions).toEqual([]);
		expect(body.meta.pagination.total_pages).toBe(0);
	});

	it("returns 404 for an unknown customer", async () => {
		vi.mocked(db.sequelize.query).mockResolvedValueOnce([]);
		const next = vi.fn();
		await getCustomerDetailReport(
			{ params: { customerId: CUSTOMER_ID }, query: {} },
			response(),
			next,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 404 }),
		);
		expect(db.sequelize.query).toHaveBeenCalledTimes(1);
	});

	it.each([
		{ customerId: "invalid", query: {} },
		{ customerId: CUSTOMER_ID, query: { view: "inventory" } },
		{ customerId: CUSTOMER_ID, query: { to: "2026-02-30" } },
	])(
		"rejects invalid input before querying: %j",
		async ({ customerId, query }) => {
			const next = vi.fn();
			await getCustomerDetailReport(
				{ params: { customerId }, query },
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
