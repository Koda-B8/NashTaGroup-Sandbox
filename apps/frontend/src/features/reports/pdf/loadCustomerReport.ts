import { safePdfText } from "../../../libs/pdf/primitives";
import {
	formatDay,
	formatGeneratedAt,
	sanitize,
} from "../../../libs/pdf/report";
import {
	exportCustomerDetailReport,
	type CustomerDetailCashier,
	type CustomerDetailProduct,
	type CustomerDetailReport,
	type CustomerDetailTransaction,
	type CustomerDetailView,
} from "../api";
import { formatCurrency } from "../format";
import type {
	CustomerReportPdfColumn,
	CustomerReportPdfData,
} from "./customerReportPdf";

const VIEW_LABEL: Record<CustomerDetailView, string> = {
	transactions: "Transactions",
	products: "Products",
	cashiers: "Cashiers",
};

const TRANSACTION_COLUMNS: CustomerReportPdfColumn[] = [
	{ label: "Transaction", width: 62, align: "left" },
	{ label: "Cashier", width: 44, align: "left" },
	{ label: "Payment", width: 36, align: "left" },
	{ label: "Gross Sales", width: 23, align: "right" },
	{ label: "Total", width: 23, align: "right" },
];

const PRODUCT_COLUMNS: CustomerReportPdfColumn[] = [
	{ label: "Product", width: 64, align: "left" },
	{ label: "Transactions", width: 28, align: "right" },
	{ label: "Units", width: 22, align: "right" },
	{ label: "Gross Sales", width: 40, align: "right" },
	{ label: "Last", width: 34, align: "right" },
];

const CASHIER_COLUMNS: CustomerReportPdfColumn[] = [
	{ label: "Cashier", width: 74, align: "left" },
	{ label: "Transactions", width: 36, align: "right" },
	{ label: "Total Sales", width: 44, align: "right" },
	{ label: "Last", width: 34, align: "right" },
];

function columnsFor(view: CustomerDetailView): CustomerReportPdfColumn[] {
	if (view === "products") return PRODUCT_COLUMNS;
	if (view === "cashiers") return CASHIER_COLUMNS;
	return TRANSACTION_COLUMNS;
}

function buildRows(
	view: CustomerDetailView,
	report: CustomerDetailReport,
): string[][] {
	if (view === "transactions") {
		return (report.transactions ?? []).map(
			(item: CustomerDetailTransaction) => [
				safePdfText(item.transaction_number),
				safePdfText(item.cashier_name),
				safePdfText(item.payment_method_name ?? "—"),
				safePdfText(formatCurrency(item.gross_sales)),
				safePdfText(formatCurrency(item.total_sales)),
			],
		);
	}
	if (view === "products") {
		return (report.products ?? []).map((item: CustomerDetailProduct) => [
			safePdfText(item.product_name),
			String(item.transaction_count),
			String(item.units_bought),
			safePdfText(formatCurrency(item.gross_sales)),
			formatDay(item.last_transaction_at),
		]);
	}
	return (report.cashiers ?? []).map((item: CustomerDetailCashier) => [
		safePdfText(item.cashier_name),
		String(item.transaction_count),
		safePdfText(formatCurrency(item.total_sales)),
		formatDay(item.last_transaction_at),
	]);
}

export async function loadCustomerReportPdfData(opts: {
	customerId: string;
	customerName: string | null;
	view: CustomerDetailView;
	from?: string;
	to?: string;
	rangeLabel?: string;
	generatedBy: string;
	now?: Date;
}): Promise<CustomerReportPdfData> {
	const now = opts.now ?? new Date();
	const { data } = await exportCustomerDetailReport(opts.customerId, {
		view: opts.view,
		from: opts.from,
		to: opts.to,
	});
	const report = (data ?? {}) as CustomerDetailReport;
	const summary = report.summary;

	const columns = columnsFor(opts.view);
	const rows = buildRows(opts.view, report);

	const periodLabel =
		opts.rangeLabel ??
		(report.customer ? `All time · ${VIEW_LABEL[opts.view]}` : "All time");

	const fileCode = sanitize(
		opts.customerName?.trim() ||
			report.customer?.phone?.trim() ||
			"Unnamed Customer",
	);

	return {
		fileName: `customer-transaction-${fileCode}-${opts.view}.pdf`,
		title: "Customer Transaction Report",
		customerName: safePdfText(
			opts.customerName?.trim() ||
				report.customer?.phone?.trim() ||
				"Unnamed Customer",
		),
		viewLabel: VIEW_LABEL[opts.view],
		periodLabel: safePdfText(periodLabel),
		generatedLabel: safePdfText(formatGeneratedAt(now, opts.generatedBy)),
		summary: [
			{
				label: "Transactions",
				value: String(summary?.transaction_count ?? 0),
			},
			{
				label: "Gross Sales",
				value: formatCurrency(summary?.gross_sales),
			},
			{
				label: "Total Sales",
				value: formatCurrency(summary?.total_sales),
			},
			{
				label: "Avg / Txn",
				value: formatCurrency(summary?.average_transaction),
			},
		],
		columns,
		rows,
	};
}
