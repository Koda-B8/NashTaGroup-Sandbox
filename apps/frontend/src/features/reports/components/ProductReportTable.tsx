import DataTable, {
	createTableColumnHelper,
} from "../../../components/tables/data-table";
import { formatDate } from "../../../libs/format";
import type {
	ProductDetailCashier,
	ProductDetailCustomer,
	ProductDetailTransaction,
	ProductDetailView,
} from "../api";
import { formatCurrency } from "../format";

type ReportRow =
	| ProductDetailTransaction
	| ProductDetailCustomer
	| ProductDetailCashier;

interface Props {
	view: ProductDetailView;
	loading: boolean;
	rows: ReportRow[];
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

const helper = createTableColumnHelper<ReportRow>();

const transactionColumns = helper.columns([
	helper.display({
		id: "transaction",
		header: "Transaction",
		cell: ({ row }) => {
			const item = row.original as ProductDetailTransaction;
			return (
				<div className="flex flex-col">
					<span className="font-medium text-text-h">
						{item.transaction_number}
					</span>
					<span className="text-2xs text-text">
						{formatDate(item.created_at)}
					</span>
				</div>
			);
		},
	}),
	helper.display({
		id: "customer",
		header: "Customer",
		cell: ({ row }) => {
			const item = row.original as ProductDetailTransaction;
			return (
				<div className="flex flex-col">
					<span className="text-text-h">
						{item.customer_name ?? "Non-member"}
					</span>
					{item.customer_phone && (
						<span className="text-2xs text-text">{item.customer_phone}</span>
					)}
				</div>
			);
		},
		meta: { cellClassName: "text-xs" },
	}),
	helper.display({
		id: "cashier",
		header: "Cashier",
		cell: ({ row }) => (row.original as ProductDetailTransaction).cashier_name,
		meta: { cellClassName: "text-xs text-text" },
	}),
	helper.display({
		id: "qty",
		header: "Qty",
		cell: ({ row }) => (row.original as ProductDetailTransaction).quantity,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "sales",
		header: "Gross Sales",
		cell: ({ row }) =>
			formatCurrency((row.original as ProductDetailTransaction).gross_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
]);

const customerColumns = helper.columns([
	helper.display({
		id: "customer",
		header: "Customer",
		cell: ({ row }) => {
			const item = row.original as ProductDetailCustomer;
			return (
				<div className="flex flex-col">
					<span className="font-medium text-text-h">
						{item.customer_name ?? "Non-member"}
					</span>
					{item.customer_phone && (
						<span className="text-2xs text-text">{item.customer_phone}</span>
					)}
				</div>
			);
		},
	}),
	helper.display({
		id: "transactions",
		header: "Transactions",
		cell: ({ row }) =>
			(row.original as ProductDetailCustomer).transaction_count,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "units",
		header: "Units",
		cell: ({ row }) => (row.original as ProductDetailCustomer).units_sold,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "sales",
		header: "Gross Sales",
		cell: ({ row }) =>
			formatCurrency((row.original as ProductDetailCustomer).gross_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
	helper.display({
		id: "last",
		header: "Last",
		cell: ({ row }) => {
			const item = row.original as ProductDetailCustomer;
			return item.last_transaction_at
				? formatDate(item.last_transaction_at)
				: "—";
		},
		meta: { cellClassName: "text-2xs text-text" },
	}),
]);

const cashierColumns = helper.columns([
	helper.display({
		id: "cashier",
		header: "Cashier",
		cell: ({ row }) => {
			const item = row.original as ProductDetailCashier;
			return (
				<div className="flex flex-col">
					<span className="font-medium text-text-h">{item.cashier_name}</span>
					<span className="text-2xs text-text">@{item.cashier_username}</span>
				</div>
			);
		},
	}),
	helper.display({
		id: "transactions",
		header: "Transactions",
		cell: ({ row }) => (row.original as ProductDetailCashier).transaction_count,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "units",
		header: "Units",
		cell: ({ row }) => (row.original as ProductDetailCashier).units_sold,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "sales",
		header: "Gross Sales",
		cell: ({ row }) =>
			formatCurrency((row.original as ProductDetailCashier).gross_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
	helper.display({
		id: "last",
		header: "Last",
		cell: ({ row }) => {
			const item = row.original as ProductDetailCashier;
			return item.last_transaction_at
				? formatDate(item.last_transaction_at)
				: "—";
		},
		meta: { cellClassName: "text-2xs text-text" },
	}),
]);

function columnsFor(view: ProductDetailView) {
	if (view === "customers") return customerColumns;
	if (view === "cashiers") return cashierColumns;
	return transactionColumns;
}

export default function ProductReportTable({
	view,
	loading,
	rows,
	pageCount,
	safePage,
	onPageChange,
	totalLabel,
}: Props) {
	return (
		<DataTable
			label="Product report"
			columns={columnsFor(view)}
			rows={rows}
			rowId={(row) => {
				if ("transaction_id" in row) return row.transaction_id;
				if ("customer_id" in row) return row.customer_id ?? "nonmember";
				return row.cashier_id;
			}}
			loading={loading}
			loadingLabel="Memuat report..."
			emptyLabel="Belum ada data untuk filter ini."
			pageCount={pageCount}
			safePage={safePage}
			onPageChange={onPageChange}
			totalLabel={totalLabel}
			pageSize={8}
		/>
	);
}
