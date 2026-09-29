import { safePdfText } from "../../../libs/pdf/primitives";
import { formatGeneratedAt, formatStamp } from "../../../libs/pdf/report";
import { formatCurrency } from "../../reports/format";
import {
	listTransactions,
	type MemberType,
	type Transaction,
	type TransactionStatus,
} from "../api";
import { statusLabel, toNumber } from "../format";
import type {
	TransactionsReportPdfColumn,
	TransactionsReportPdfData,
} from "./transactionsReportPdf";

const PAGE_LIMIT = 100;
const MAX_ROWS = 5000;

const COLUMNS: TransactionsReportPdfColumn[] = [
	{ label: "Transaction", width: 40, align: "left" },
	{ label: "Date", width: 26, align: "left" },
	{ label: "Cashier", width: 30, align: "left" },
	{ label: "Customer", width: 32, align: "left" },
	{ label: "Payment", width: 22, align: "left" },
	{ label: "Status", width: 16, align: "left" },
	{ label: "Total", width: 22, align: "right" },
];

export interface TransactionsReportFilters {
	q?: string;
	status?: TransactionStatus;
	member_type?: MemberType;
	month?: string;
	cashier_id?: string;
	payment_method_id?: string;
	customer_id?: string;
}

async function fetchAllTransactions(
	filters: TransactionsReportFilters,
): Promise<{ rows: Transaction[]; total: number }> {
	const rows: Transaction[] = [];
	let total = 0;
	for (let page = 1; rows.length < MAX_ROWS; page += 1) {
		const { data, meta } = await listTransactions({
			...filters,
			page,
			limit: PAGE_LIMIT,
		});
		total = meta?.pagination.total_items ?? rows.length + data.length;
		if (data.length === 0) break;
		rows.push(...data);
		if (rows.length >= total) break;
	}
	return { rows: rows.slice(0, MAX_ROWS), total };
}

function dateStamp(now: Date): string {
	return now.toISOString().slice(0, 10);
}

export async function loadTransactionsReportPdfData(opts: {
	filters: TransactionsReportFilters;
	filterLabel: string;
	generatedBy: string;
	now?: Date;
}): Promise<TransactionsReportPdfData> {
	const now = opts.now ?? new Date();
	const { rows, total } = await fetchAllTransactions(opts.filters);

	const completed = rows.filter(
		(transaction) => transaction.status === "completed",
	);
	const pending = rows.filter(
		(transaction) => transaction.status === "pending",
	);
	const revenue = completed.reduce(
		(sum, transaction) => sum + toNumber(transaction.totalAmount),
		0,
	);

	const truncated = total > rows.length;
	const generatedLabel = formatGeneratedAt(now, opts.generatedBy);

	return {
		fileName: `transactions-report-${dateStamp(now)}.pdf`,
		title: "Transactions Report",
		subtitle: "Nashta Group · Transaction history",
		periodLabel: safePdfText(opts.filterLabel),
		generatedLabel: safePdfText(
			truncated
				? `${generatedLabel} · first ${rows.length} of ${total} rows`
				: generatedLabel,
		),
		summary: [
			{ label: "Transactions", value: String(rows.length) },
			{ label: "Completed", value: String(completed.length) },
			{ label: "Pending", value: String(pending.length) },
			{ label: "Revenue", value: formatCurrency(revenue) },
		],
		tableLabel: "Transactions",
		columns: COLUMNS,
		rows: rows.map((transaction) => [
			safePdfText(transaction.transactionNumber),
			safePdfText(formatStamp(transaction.createdAt)),
			safePdfText(transaction.cashier?.fullname ?? "—"),
			safePdfText(transaction.customer?.name ?? "Non-member"),
			safePdfText(transaction.payment.method ?? "—"),
			safePdfText(statusLabel(transaction.status)),
			safePdfText(formatCurrency(toNumber(transaction.totalAmount))),
		]),
	};
}
