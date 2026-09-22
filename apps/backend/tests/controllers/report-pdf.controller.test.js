import { beforeEach, describe, expect, it, vi } from "vitest";

import { exportReportPdf } from "../../src/controllers/report-pdf.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: { sequelize: { query: vi.fn() } },
}));

const response = () => ({ set: vi.fn(), send: vi.fn() });

beforeEach(() => vi.clearAllMocks());

describe("PDF report export", () => {
	it.each([
		["customers", [{ transactions: 0 }, { total: 0 }, [], []]],
		["products", [{ total: 0 }, { variants: 0 }, [], []]],
		["inventory", [{ total: 0 }, { variants: 0 }, [], []]],
		["payment-methods", [{ transaction_count: 0 }, { total: 0 }, []]],
		["cashiers", [{ transaction_count: 0 }, { total: 0 }, []]],
	])(
		"creates a valid %s PDF when there are no rows",
		async (report, results) => {
			for (const rows of results)
				vi.mocked(db.sequelize.query).mockResolvedValueOnce([rows].flat());
			const res = response();
			const next = vi.fn();
			await exportReportPdf({ params: { report }, query: {} }, res, next);
			expect(next).not.toHaveBeenCalled();
			expect(res.send.mock.calls[0][0].subarray(0, 5).toString()).toBe("%PDF-");
		},
	);

	it("downloads all filtered sales periods across report pages", async () => {
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
		await exportReportPdf(
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
		expect(res.set).toHaveBeenCalledWith(
			expect.objectContaining({
				"Content-Type": "application/pdf",
				"Content-Disposition": expect.stringMatching(
					/^attachment; filename="report-sales-\d{4}-\d{2}-\d{2}\.pdf"$/,
				),
			}),
		);
		const pdf = res.send.mock.calls[0][0];
		expect(Buffer.isBuffer(pdf)).toBe(true);
		expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
		expect(pdf.length).toBeGreaterThan(1000);
	});

	it("rejects exports above the row limit before rendering", async () => {
		vi.mocked(db.sequelize.query)
			.mockResolvedValueOnce([{ transaction_count: 5001 }])
			.mockResolvedValueOnce([{ total: 5001 }])
			.mockResolvedValueOnce([]);
		const res = response();
		const next = vi.fn();
		await exportReportPdf(
			{ params: { report: "sales" }, query: {} },
			res,
			next,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 413 }),
		);
		expect(db.sequelize.query).toHaveBeenCalledTimes(3);
		expect(res.send).not.toHaveBeenCalled();
	});

	it.each(["missing", "constructor", "__proto__"])(
		"rejects unsupported report name %s",
		async (report) => {
			const next = vi.fn();
			await exportReportPdf(
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
		await exportReportPdf(
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
