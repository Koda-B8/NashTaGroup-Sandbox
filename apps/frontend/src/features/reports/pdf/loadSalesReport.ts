import { listProducts } from "../../products/api";
import {
	type CashierReport,
	exportReportData,
	getSalesReport,
	type InventoryReport,
	type PaymentMethodReport,
	type ProductReport,
	type SalesPeriod,
	type SalesReport,
} from "../api";
import { fillSalesPeriods, toNumber, type TimeRange } from "../format";
import type {
	PdfCashierRow,
	PdfCategoryRow,
	PdfMethodRow,
	PdfProductRow,
	PdfStockRow,
	PdfTrendPoint,
	SalesReportPdfData,
} from "./types";

const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function toDateValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date {
	return new Date(`${value}T00:00:00`);
}

function previousRange(from: string, to: string): { from: string; to: string } {
	const start = parseDateValue(from);
	const end = parseDateValue(to);
	const days = Math.max(
		1,
		Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
	);
	const prevTo = new Date(start);
	prevTo.setDate(prevTo.getDate() - 1);
	const prevFrom = new Date(prevTo);
	prevFrom.setDate(prevFrom.getDate() - (days - 1));
	return { from: toDateValue(prevFrom), to: toDateValue(prevTo) };
}

function formatRangeLabel(from: string, to: string): string {
	const start = parseDateValue(from);
	const end = parseDateValue(to);
	const sameYear = start.getFullYear() === end.getFullYear();
	const startLabel = new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		...(sameYear ? {} : { year: "numeric" }),
	}).format(start);
	const endLabel = new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(end);
	return `${startLabel} to ${endLabel}`;
}

function summaryWord(range: TimeRange): string {
	return {
		"1M": "Monthly",
		"3M": "Quarterly",
		"6M": "Half-year",
		"1Y": "Annual",
	}[range];
}

function formatGeneratedAt(now: Date, user: string): string {
	const stamp = new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "Asia/Jakarta",
	}).format(now);
	return `Exported ${stamp} WIB • ${user}`;
}

function trendLabel(periodStart: string, period: SalesPeriod): string {
	const date = parseDateValue(periodStart);
	if (Number.isNaN(date.getTime())) return periodStart;
	if (period === "year") return String(date.getFullYear());
	if (period === "month") return MONTH_SHORT[date.getMonth()] ?? periodStart;
	return String(date.getDate());
}

function delta(current: number, previous: number): number | null {
	if (!Number.isFinite(previous) || previous <= 0) return null;
	return ((current - previous) / previous) * 100;
}

async function loadCategoryMap(): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	for (let page = 1; page <= 10; page++) {
		const { data, meta } = await listProducts({ page, limit: 100 });
		for (const product of data) {
			map.set(product.id, product.category?.name ?? "Uncategorized");
		}
		const totalPages = meta?.pagination.total_pages ?? 1;
		if (data.length === 0 || page >= totalPages) break;
	}
	return map;
}

export async function loadSalesReportPdfData(opts: {
	range: TimeRange;
	from: string;
	to: string;
	period: SalesPeriod;
	generatedBy: string;
	now?: Date;
}): Promise<SalesReportPdfData> {
	const now = opts.now ?? new Date();
	const { from, to, period } = opts;
	const previous = previousRange(from, to);

	const [
		salesRes,
		productsRes,
		methodsRes,
		cashiersRes,
		inventoryRes,
		prevSalesRes,
		categoryMap,
	] = await Promise.all([
		exportReportData("sales", { from, to, period }),
		exportReportData("products", { from, to }),
		exportReportData("payment-methods", { from, to }),
		exportReportData("cashiers", { from, to }),
		exportReportData("inventory", { from, to }),
		getSalesReport({ from: previous.from, to: previous.to, period, limit: 1 }),
		loadCategoryMap(),
	]);

	const sales = salesRes.data as SalesReport;
	const products = productsRes.data as ProductReport;
	const methods = methodsRes.data as PaymentMethodReport;
	const cashiers = cashiersRes.data as CashierReport;
	const inventory = inventoryRes.data as InventoryReport;

	const revenue = toNumber(sales.summary.total_sales);
	const transactions = toNumber(sales.summary.transaction_count);
	const avgOrder = toNumber(sales.summary.average_transaction);
	const unitsSold = toNumber(products.summary.units_sold);

	const grossSales = toNumber(products.summary.gross_sales);

	const trend: PdfTrendPoint[] = fillSalesPeriods(
		sales.rows ?? [],
		sales.period,
		from,
		to,
	).map((point) => ({
		label: trendLabel(point.periodStart, sales.period),
		value: point.value,
	}));

	const topProducts: PdfProductRow[] = (products.items ?? [])
		.toSorted((a, b) => toNumber(b.units_sold) - toNumber(a.units_sold))
		.slice(0, 5)
		.map((item) => ({
			name: item.product_name,
			code: item.product_code,
			qty: toNumber(item.units_sold),
			revenue: toNumber(item.gross_sales),
			share:
				grossSales > 0 ? (toNumber(item.gross_sales) / grossSales) * 100 : 0,
		}));

	const categoryTotals = new Map<string, number>();
	for (const item of products.items ?? []) {
		const name = categoryMap.get(item.product_id) ?? "Uncategorized";
		categoryTotals.set(
			name,
			(categoryTotals.get(name) ?? 0) + toNumber(item.gross_sales),
		);
	}
	const categories: PdfCategoryRow[] = [...categoryTotals]
		.map(([name, value]) => ({
			name,
			revenue: value,
			share: grossSales > 0 ? (value / grossSales) * 100 : 0,
		}))
		.toSorted((a, b) => b.revenue - a.revenue)
		.slice(0, 5);

	const paymentMethods: PdfMethodRow[] = (methods.methods ?? [])
		.toSorted((a, b) => toNumber(b.total_sales) - toNumber(a.total_sales))
		.slice(0, 4)
		.map((method) => ({
			name: method.name,
			txn: toNumber(method.transaction_count),
			revenue: toNumber(method.total_sales),
			share: revenue > 0 ? (toNumber(method.total_sales) / revenue) * 100 : 0,
		}));

	const cashierRows: PdfCashierRow[] = (cashiers.cashiers ?? [])
		.toSorted((a, b) => toNumber(b.total_sales) - toNumber(a.total_sales))
		.slice(0, 4)
		.map((cashier) => ({
			name: cashier.fullname,
			username: cashier.username,
			txn: toNumber(cashier.transaction_count),
			revenue: toNumber(cashier.total_sales),
			share: revenue > 0 ? (toNumber(cashier.total_sales) / revenue) * 100 : 0,
		}));

	const stockAlerts: PdfStockRow[] = (inventory.items ?? [])
		.filter((item) => toNumber(item.current_stock) <= 5)
		.toSorted((a, b) => toNumber(a.current_stock) - toNumber(b.current_stock))
		.slice(0, 4)
		.map((item) => {
			const stock = toNumber(item.current_stock);
			return {
				name: item.product_name,
				code: item.product_code,
				stock,
				sold: toNumber(item.units_sold),
				status: stock <= 0 ? "out" : "low",
			};
		});

	const periodWord = period === "month" ? "Monthly" : "Daily";

	return {
		fileName: `sales-report-${from}-to-${to}.pdf`,
		periodLabel: formatRangeLabel(from, to),
		subtitle: `Nashta Group • ${summaryWord(opts.range)} summary`,
		generatedLabel: formatGeneratedAt(now, opts.generatedBy),
		summary: {
			revenue,
			transactions,
			avgOrder,
			unitsSold,
			variants: toNumber(products.summary.variants),
			revenueDelta: delta(
				revenue,
				toNumber(prevSalesRes.data.summary.total_sales),
			),
			transactionsDelta: delta(
				transactions,
				toNumber(prevSalesRes.data.summary.transaction_count),
			),
			avgDelta: delta(
				avgOrder,
				toNumber(prevSalesRes.data.summary.average_transaction),
			),
		},
		trend,
		trendSubtitle: `${periodWord} revenue, Rp millions • Total ${formatCompactTrend(revenue)}`,
		topProducts,
		categories,
		paymentMethods,
		cashiers: cashierRows,
		stockAlerts,
	};
}

function formatCompactTrend(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}B`;
	if (abs >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}M`;
	if (abs >= 1e3) return `Rp ${(value / 1e3).toFixed(1)}K`;
	return `Rp ${Math.round(value)}`;
}
