import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	getCashierReport,
	getCustomerReport,
	getInventoryReport,
	getPaymentMethodReport,
	getProductReport,
	getSalesReport,
	parseReportFilters,
} from "../../src/controllers/report.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: { sequelize: { query: vi.fn() } },
}));

const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

beforeEach(() => vi.clearAllMocks());

describe("report filters", () => {
	it("uses inclusive dates and bounded pagination", () => {
		const filters = parseReportFilters({
			from: "2026-09-01",
			to: "2026-09-30",
			page: "2",
			limit: "10",
		});
		expect(filters).toMatchObject({
			from: "2026-09-01",
			toExclusive: "2026-10-01",
			page: 2,
			limit: 10,
			offset: 10,
		});
	});

	it.each([
		{ from: "2026-02-30" },
		{ from: "2026-10-01", to: "2026-09-30" },
		{ page: "0" },
		{ limit: "101" },
	])("rejects invalid filters: %j", (query) => {
		expect(() => parseReportFilters(query)).toThrow();
	});
});

describe("report endpoints", () => {
	it.each(["day", "week", "month", "year"])(
		"groups completed sales by %s in Jakarta time",
		async (period) => {
			vi.mocked(db.sequelize.query)
				.mockResolvedValueOnce([
					// @ts-ignore
					{ transaction_count: 3, total_sales: "150000.00" },
				])
				// @ts-ignore
				.mockResolvedValueOnce([{ total: 1 }])
				.mockResolvedValueOnce([
					{
						// @ts-ignore
						period_start: "2026-09-21",
						transaction_count: 3,
						total_sales: "150000.00",
					},
				]);
			const res = response();
			const next = vi.fn();
			await getSalesReport(
				{ query: { period, from: "2026-09-21", to: "2026-09-21" } },
				res,
				next,
			);
			expect(next).not.toHaveBeenCalled();
			const body = res.json.mock.calls[0][0];
			expect(body.data).toMatchObject({ period, timezone: "Asia/Jakarta" });
			expect(body.data.rows[0]).toMatchObject({ transaction_count: 3 });
			expect(body.meta.pagination).toEqual({
				page: 1,
				limit: 20,
				total_items: 1,
				total_pages: 1,
			});
			const calls = vi.mocked(db.sequelize.query).mock.calls;
			expect(calls[0][0]).toContain("t.status = 'completed'");
			expect(calls[2][0]).toContain(
				`date_trunc('${period}', t.created_at AT TIME ZONE 'Asia/Jakarta')`,
			);
			expect(calls[0][0]).toContain(
				"CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'",
			);
			// @ts-ignore
			expect(calls[0][1].replacements).toMatchObject({
				from: "2026-09-21",
				toExclusive: "2026-09-22",
			});
		},
	);

	it("rejects unsupported sales periods before querying", async () => {
		const next = vi.fn();
		await getSalesReport({ query: { period: "hour" } }, response(), next);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 400 }),
		);
		expect(db.sequelize.query).not.toHaveBeenCalled();
	});

	it("separates member purchases and nonmember product totals", async () => {
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([
				{
					// @ts-ignore
					transactions: 2,
					member_transactions: 1,
					non_member_transactions: 1,
					gross_sales: "100000.00",
					discount_amount: "10000.00",
					tax_amount: "9000.00",
					total_sales: "99000.00",
					non_member_total_sales: "50000.00",
				},
			])
			// @ts-ignore
			.mockResolvedValueOnce([{ total: 1 }])
			.mockResolvedValueOnce([
				{
					// @ts-ignore
					id: "customer-1",
					transaction_count: 1,
					products: [{ product_name: "Shirt", quantity: 2 }],
				},
			])
			// @ts-ignore
			.mockResolvedValueOnce([{ product_name: "Cap", quantity: 1 }]);
		const res = response();
		const next = vi.fn();
		await getCustomerReport(
			{ query: { from: "2026-09-01", to: "2026-09-30" } },
			res,
			next,
		);
		expect(next).not.toHaveBeenCalled();
		const body = res.json.mock.calls[0][0];
		expect(body.data.timezone).toBe("Asia/Jakarta");
		expect(body.data.summary).toMatchObject({
			gross_sales: "100000.00",
			total_sales: "99000.00",
			revenue: "99000.00",
			non_member_total_sales: "50000.00",
			non_member_revenue: "50000.00",
		});
		expect(body.data.members[0]).toMatchObject({ id: "customer-1" });
		expect(body.data.non_member_products[0]).toMatchObject({
			product_name: "Cap",
		});
		const calls = vi.mocked(db.sequelize.query).mock.calls;
		expect(calls[0][0]).toContain("t.status = 'completed'");
		expect(calls[0][0]).toContain(
			"CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'",
		);
		// @ts-ignore
		expect(calls[0][1].replacements).toMatchObject({
			from: "2026-09-01",
			toExclusive: "2026-10-01",
		});
		expect(calls[3][0]).toContain("t.customer_id IS NULL");
	});

	it.each([getProductReport, getInventoryReport])(
		"returns item totals and recent activity",
		async (handler) => {
			vi.mocked(db.sequelize.query)
				// @ts-ignore
				.mockResolvedValueOnce([{ total: 1 }])
				.mockResolvedValueOnce([
					{
						// @ts-ignore
						variants: 1,
						current_stock: 5,
						units_sold: 2,
						gross_sales: "40000.00",
					},
				])
				.mockResolvedValueOnce([
					{
						// @ts-ignore
						product_item_id: "item-1",
						current_stock: 5,
						gross_sales: "40000.00",
					},
				])
				// @ts-ignore
				.mockResolvedValueOnce([]);
			const res = response();
			await handler(
				{ query: { from: "2026-09-01", to: "2026-09-30" } },
				res,
				vi.fn(),
			);
			const body = res.json.mock.calls[0][0];
			expect(body.meta.pagination).toEqual({
				page: 1,
				limit: 20,
				total_items: 1,
				total_pages: 1,
			});
			expect(body.data.timezone).toBe("Asia/Jakarta");
			expect(body.data.summary).toMatchObject({
				gross_sales: "40000.00",
				revenue: "40000.00",
			});
			expect(body.data.items[0]).toMatchObject({
				product_item_id: "item-1",
				gross_sales: "40000.00",
				revenue: "40000.00",
			});
			const calls = vi.mocked(db.sequelize.query).mock.calls;
			expect(calls[0][0]).toContain(
				"CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'",
			);
			// @ts-ignore
			expect(calls[0][1].replacements).toMatchObject({
				from: "2026-09-01",
				toExclusive: "2026-10-01",
			});
		},
	);

	it("reports paid amounts per payment method and separates cash tender from sales", async () => {
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([
				{
					// @ts-ignore
					transaction_count: 3,
					paid_transaction_count: 2,
					missing_payment_count: 1,
					total_sales: "150000.00",
					collected_amount: "100000.00",
					payment_gap: "50000.00",
				},
			])
			// @ts-ignore
			.mockResolvedValueOnce([{ total: 2 }])
			.mockResolvedValueOnce([
				{
					// @ts-ignore
					payment_method_id: "cash-id",
					name: "Cash",
					type: "cash",
					transaction_count: 2,
					collected_amount: "100000.00",
					cash_tendered: "120000.00",
					change_given: "20000.00",
				},
			]);
		const res = response();
		const next = vi.fn();
		await getPaymentMethodReport(
			{
				query: { from: "2026-09-01", to: "2026-09-30", page: "2", limit: "1" },
			},
			res,
			next,
		);
		expect(next).not.toHaveBeenCalled();
		const body = res.json.mock.calls[0][0];
		expect(body.data.timezone).toBe("Asia/Jakarta");
		expect(body.data.summary).toMatchObject({
			missing_payment_count: 1,
			payment_gap: "50000.00",
		});
		expect(body.data.methods[0]).toMatchObject({
			collected_amount: "100000.00",
			cash_tendered: "120000.00",
			change_given: "20000.00",
		});
		expect(body.meta.pagination).toEqual({
			page: 2,
			limit: 1,
			total_items: 2,
			total_pages: 2,
		});
		const calls = vi.mocked(db.sequelize.query).mock.calls;
		expect(calls[0][0]).toContain("LEFT JOIN payments p");
		expect(calls[0][0]).toContain("p.status = 'paid'");
		expect(calls[2][0]).toContain("p.status = 'paid'");
		expect(calls[2][0]).toContain("t.status = 'completed'");
		expect(calls[2][0]).toContain("SUM(s.amount)");
		expect(calls[2][0]).toContain("FILTER (WHERE pm.type = 'cash')");
		expect(calls[2][0]).toContain("LEFT JOIN paid_sales");
		// @ts-ignore
		expect(calls[2][1].replacements).toMatchObject({
			from: "2026-09-01",
			toExclusive: "2026-10-01",
			limit: 1,
			offset: 1,
		});
	});

	it("reports cashier sales for members and nonmembers with paid reconciliation", async () => {
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([
				{
					// @ts-ignore
					transaction_count: 3,
					paid_transaction_count: 2,
					missing_payment_count: 1,
					total_sales: "150000.00",
					collected_amount: "100000.00",
					payment_gap: "50000.00",
				},
			])
			// @ts-ignore
			.mockResolvedValueOnce([{ total: 1 }])
			.mockResolvedValueOnce([
				{
					// @ts-ignore
					cashier_id: "user-id",
					fullname: "Kasir Satu",
					transaction_count: 3,
					member_transactions: 2,
					non_member_transactions: 1,
					paid_transaction_count: 2,
					total_sales: "150000.00",
					collected_amount: "100000.00",
					payment_gap: "50000.00",
				},
			]);
		const res = response();
		const next = vi.fn();
		await getCashierReport({ query: { from: "2026-09-01" } }, res, next);
		expect(next).not.toHaveBeenCalled();
		const body = res.json.mock.calls[0][0];
		expect(body.data.timezone).toBe("Asia/Jakarta");
		expect(body.data.cashiers[0]).toMatchObject({
			member_transactions: 2,
			non_member_transactions: 1,
			payment_gap: "50000.00",
		});
		expect(body.meta.pagination).toEqual({
			page: 1,
			limit: 20,
			total_items: 1,
			total_pages: 1,
		});
		const calls = vi.mocked(db.sequelize.query).mock.calls;
		expect(calls[1][0]).toContain("COUNT(DISTINCT t.user_id)");
		expect(calls[2][0]).toContain(
			"COUNT(t.id) FILTER (WHERE t.customer_id IS NULL)",
		);
		expect(calls[2][0]).toContain("p.status = 'paid'");
		expect(calls[2][0]).toContain("SUM(p.amount)");
		expect(calls[2][0]).toContain(
			"CAST(:from AS timestamp) AT TIME ZONE 'Asia/Jakarta'",
		);
	});
});
