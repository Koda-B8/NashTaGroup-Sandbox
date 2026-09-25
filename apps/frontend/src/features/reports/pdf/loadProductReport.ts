import { safePdfText } from "../../../libs/pdf/primitives";
import {
	formatDay,
	formatGeneratedAt,
	sanitize,
} from "../../../libs/pdf/report";
import {
	exportProductDetailReport,
	type ProductDetailCashier,
	type ProductDetailCustomer,
	type ProductDetailReport,
	type ProductDetailTransaction,
	type ProductDetailView,
} from "../api";
import { formatCurrency } from "../format";
import type {
	ProductReportPdfColumn,
	ProductReportPdfData,
} from "./productReportPdf";

const VIEW_LABEL: Record<ProductDetailView, string> = {
	transactions: "Transactions",
	customers: "Customers",
	cashiers: "Cashiers",
};

const TRANSACTION_COLUMNS: ProductReportPdfColumn[] = [
	{ label: "Transaction", width: 66, align: "left" },
	{ label: "Customer", width: 46, align: "left" },
	{ label: "Cashier", width: 30, align: "left" },
	{ label: "Qty", width: 16, align: "right" },
	{ label: "Gross Sales", width: 30, align: "right" },
];

const GROUPED_COLUMNS: ProductReportPdfColumn[] = [
	{ label: "Name", width: 64, align: "left" },
	{ label: "Transactions", width: 28, align: "right" },
	{ label: "Units", width: 22, align: "right" },
	{ label: "Gross Sales", width: 40, align: "right" },
	{ label: "Last", width: 34, align: "right" },
];

function buildRows(
	view: ProductDetailView,
	report: ProductDetailReport,
): string[][] {
	if (view === "transactions") {
		return (report.transactions ?? []).map((item: ProductDetailTransaction) => [
			safePdfText(item.transaction_number),
			safePdfText(item.customer_name ?? "Non-member"),
			safePdfText(item.cashier_name),
			String(item.quantity),
			safePdfText(formatCurrency(item.gross_sales)),
		]);
	}
	if (view === "customers") {
		return (report.customers ?? []).map((item: ProductDetailCustomer) => [
			safePdfText(item.customer_name ?? "Non-member"),
			String(item.transaction_count),
			String(item.units_sold),
			safePdfText(formatCurrency(item.gross_sales)),
			formatDay(item.last_transaction_at),
		]);
	}
	return (report.cashiers ?? []).map((item: ProductDetailCashier) => [
		safePdfText(item.cashier_name),
		String(item.transaction_count),
		String(item.units_sold),
		safePdfText(formatCurrency(item.gross_sales)),
		formatDay(item.last_transaction_at),
	]);
}

export async function loadProductReportPdfData(opts: {
	productId: string;
	productName: string;
	view: ProductDetailView;
	from?: string;
	to?: string;
	rangeLabel?: string;
	generatedBy: string;
	now?: Date;
}): Promise<ProductReportPdfData> {
	const now = opts.now ?? new Date();
	const { data } = await exportProductDetailReport(opts.productId, {
		view: opts.view,
		from: opts.from,
		to: opts.to,
	});
	const report = (data ?? {}) as ProductDetailReport;
	const summary = report.summary;

	const columns =
		opts.view === "transactions" ? TRANSACTION_COLUMNS : GROUPED_COLUMNS;
	const rows = buildRows(opts.view, report);

	const periodLabel =
		opts.rangeLabel ??
		(report.product ? `All time · ${VIEW_LABEL[opts.view]}` : "All time");

	const fileCode = sanitize(opts.productName);

	return {
		fileName: `product-transaction-${fileCode}-${opts.view}.pdf`,
		title: "Product Transaction Report",
		productName: safePdfText(opts.productName),
		viewLabel: VIEW_LABEL[opts.view],
		periodLabel: safePdfText(periodLabel),
		generatedLabel: safePdfText(formatGeneratedAt(now, opts.generatedBy)),
		summary: [
			{
				label: "Transactions",
				value: String(summary?.transaction_count ?? 0),
			},
			{ label: "Units Sold", value: String(summary?.units_sold ?? 0) },
			{
				label: "Gross Sales",
				value: formatCurrency(summary?.gross_sales),
			},
			{
				label: "Members",
				value: `${summary?.member_transactions ?? 0} / ${summary?.non_member_transactions ?? 0}`,
			},
		],
		columns,
		rows,
	};
}
