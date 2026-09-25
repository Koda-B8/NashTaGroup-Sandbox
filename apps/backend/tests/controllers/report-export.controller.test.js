import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	exportCustomerDetailReport,
	exportProductDetailReport,
	exportReportData,
} from "../../src/controllers/report-export.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: { sequelize: { query: vi.fn() } },
}));

const response = () => ({
	set: vi.fn(),
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("product master JSON export", () => {
	it("collects all customer rows for only the selected product", async () => {
		const productId = "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0";
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([{ id: productId, name: "iPhone 15" }])
			.mockResolvedValueOnce([{ transaction_count: 101 }])
			.mockResolvedValueOnce([{ total: 101 }])
			.mockResolvedValueOnce(
				Array.from({ length: 100 }, (_, i) => ({ customer_id: String(i) })),
			)
			.mockResolvedValueOnce([{ id: productId, name: "iPhone 15" }])
			.mockResolvedValueOnce([{ transaction_count: 101 }])
			.mockResolvedValueOnce([{ total: 101 }])
			.mockResolvedValueOnce([{ customer_id: "last" }]);
		const res = response();
		const next = vi.fn();
		await exportProductDetailReport(
			{
				params: { productId },
				query: { view: "customers", page: "9", limit: "1" },
			},
			res,
			next,
		);
		expect(next).not.toHaveBeenCalled();
		const body = res.json.mock.calls[0][0];
		expect(body.data.product.name).toBe("iPhone 15");
		expect(body.data.customers).toHaveLength(101);
		expect(body.meta.export.row_count).toBe(101);
		const calls = vi.mocked(db.sequelize.query).mock.calls;
		expect(calls[3][1].replacements).toMatchObject({
			productId,
			page: 1,
			limit: 100,
		});
		expect(calls[7][1].replacements).toMatchObject({
			productId,
			page: 2,
			offset: 100,
		});
	});
});

describe("customer JSON export", () => {
	it("collects all products bought by one customer across pages", async () => {
		const customerId = "8de8b4cd-b2cd-491f-a772-e5c47cc9d0a0";
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([{ id: customerId, name: "Budi" }])
			.mockResolvedValueOnce([{ transaction_count: 101 }])
			.mockResolvedValueOnce([{ total: 101 }])
			.mockResolvedValueOnce(
				Array.from({ length: 100 }, (_, i) => ({ product_id: String(i) })),
			)
			.mockResolvedValueOnce([{ id: customerId, name: "Budi" }])
			.mockResolvedValueOnce([{ transaction_count: 101 }])
			.mockResolvedValueOnce([{ total: 101 }])
			.mockResolvedValueOnce([{ product_id: "last" }]);
		const res = response();
		const next = vi.fn();
		await exportCustomerDetailReport(
			{
				params: { customerId },
				query: { view: "products", page: "9", limit: "1" },
			},
			res,
			next,
		);
		expect(next).not.toHaveBeenCalled();
		const body = res.json.mock.calls[0][0];
		expect(body.data.customer.name).toBe("Budi");
		expect(body.data.products).toHaveLength(101);
		expect(body.meta.export).toEqual({ row_count: 101, max_rows: 5000 });
		const calls = vi.mocked(db.sequelize.query).mock.calls;
		expect(calls[3][1].replacements).toMatchObject({
			customerId,
			page: 1,
			limit: 100,
		});
		expect(calls[7][1].replacements).toMatchObject({
			customerId,
			page: 2,
			offset: 100,
		});
	});
});

beforeEach(() => vi.clearAllMocks());

describe("JSON report export", () => {
	it.each([
		["customers", [{ transactions: 0 }, { total: 0 }, [], []]],
		["products", [{ total: 0 }, { variants: 0 }, [], []]],
		["inventory", [{ total: 0 }, { variants: 0 }, [], []]],
		["payment-methods", [{ transaction_count: 0 }, { total: 0 }, []]],
		["cashiers", [{ transaction_count: 0 }, { total: 0 }, []]],
	])(
		"returns %s report data when there are no rows",
		async (report, results) => {
			for (const rows of results)
				vi.mocked(db.sequelize.query).mockResolvedValueOnce([rows].flat());
			const res = response();
			const next = vi.fn();
			await exportReportData({ params: { report }, query: {} }, res, next);
			expect(next).not.toHaveBeenCalled();
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					meta: { export: { row_count: 0, max_rows: 5000 } },
				}),
			);
		},
	);

	it("returns all filtered sales periods across report pages", async () => {
		const firstPage = Array.from({ length: 100 }, (_, index) => ({
			period_start: `2026-09-${String(index + 1).padStart(2, "0")}`,
			transaction_count: 1,
			total_sales: "10000.00",
		}));
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([
				{ transaction_count: 101, total_sales: "1010000.00" },
			])
			.mockResolvedValueOnce([{ total: 101 }])
			.mockResolvedValueOnce(firstPage)
			.mockResolvedValueOnce([
				{ transaction_count: 101, total_sales: "1010000.00" },
			])
			.mockResolvedValueOnce([{ total: 101 }])
			.mockResolvedValueOnce([
				{
					period_start: "2026-12-31",
					transaction_count: 1,
					total_sales: "10000.00",
				},
			]);
		const res = response();
		const next = vi.fn();
		await exportReportData(
			{
				params: { report: "sales" },
				query: {
					from: "2026-09-01",
					to: "2026-12-31",
					period: "month",
					page: "9",
					limit: "1",
				},
			},
			res,
			next,
		);
		expect(next).not.toHaveBeenCalled();
		expect(db.sequelize.query).toHaveBeenCalledTimes(6);
		const calls = vi.mocked(db.sequelize.query).mock.calls;
		expect(calls[2][1].replacements).toMatchObject({
			page: 1,
			limit: 100,
			offset: 0,
		});
		expect(calls[5][1].replacements).toMatchObject({
			page: 2,
			limit: 100,
			offset: 100,
		});
		expect(calls[2][0]).toContain("date_trunc('month'");
		expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
		const body = res.json.mock.calls[0][0];
		expect(body.data.rows).toHaveLength(101);
		expect(body.data.rows[100].period_start).toBe("2026-12-31");
		expect(body.data.period).toBe("month");
		expect(body.meta.export).toEqual({ row_count: 101, max_rows: 5000 });
	});

	it("rejects exports above the row limit before loading more pages", async () => {
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([{ transaction_count: 5001 }])
			.mockResolvedValueOnce([{ total: 5001 }])
			.mockResolvedValueOnce([]);
		const res = response();
		const next = vi.fn();
		await exportReportData(
			{ params: { report: "sales" }, query: {} },
			res,
			next,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 413 }),
		);
		expect(db.sequelize.query).toHaveBeenCalledTimes(3);
		expect(res.json).not.toHaveBeenCalled();
	});

	it.each(["missing", "constructor", "__proto__"])(
		"rejects unsupported report name %s",
		async (report) => {
			const next = vi.fn();
			await exportReportData(
				{ params: { report }, query: {} },
				response(),
				next,
			);
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({ statusCode: 404 }),
			);
			expect(db.sequelize.query).not.toHaveBeenCalled();
		},
	);

	it("rejects invalid date filters before querying", async () => {
		const next = vi.fn();
		await exportReportData(
			{ params: { report: "sales" }, query: { from: "2026-02-30" } },
			response(),
			next,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 400 }),
		);
		expect(db.sequelize.query).not.toHaveBeenCalled();
	});
});
