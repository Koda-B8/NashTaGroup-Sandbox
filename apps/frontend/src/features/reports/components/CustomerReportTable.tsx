import DataTable, {
	createTableColumnHelper,
} from "../../../components/tables/data-table";
import { formatDate } from "../../../libs/format";
import type {
	CustomerDetailCashier,
	CustomerDetailProduct,
	CustomerDetailTransaction,
	CustomerDetailView,
} from "../api";
import { formatCurrency } from "../format";

type ReportRow =
	| CustomerDetailTransaction
	| CustomerDetailProduct
	| CustomerDetailCashier;

interface Props {
	view: CustomerDetailView;
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
			const item = row.original as CustomerDetailTransaction;
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
		id: "cashier",
		header: "Cashier",
		cell: ({ row }) => (row.original as CustomerDetailTransaction).cashier_name,
		meta: { cellClassName: "text-xs text-text" },
	}),
	helper.display({
		id: "payment",
		header: "Payment",
		cell: ({ row }) => {
			const item = row.original as CustomerDetailTransaction;
			return item.payment_method_name ?? "—";
		},
		meta: { cellClassName: "text-xs text-text" },
	}),
	helper.display({
		id: "gross",
		header: "Gross Sales",
		cell: ({ row }) =>
			formatCurrency((row.original as CustomerDetailTransaction).gross_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm",
		},
	}),
	helper.display({
		id: "total",
		header: "Total",
		cell: ({ row }) =>
			formatCurrency((row.original as CustomerDetailTransaction).total_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
]);

const productColumns = helper.columns([
	helper.display({
		id: "product",
		header: "Product",
		cell: ({ row }) => {
			const item = row.original as CustomerDetailProduct;
			return (
				<div className="flex flex-col">
					<span className="font-medium text-text-h">{item.product_name}</span>
				</div>
			);
		},
	}),
	helper.display({
		id: "transactions",
		header: "Transactions",
		cell: ({ row }) =>
			(row.original as CustomerDetailProduct).transaction_count,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "units",
		header: "Units",
		cell: ({ row }) => (row.original as CustomerDetailProduct).units_bought,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "sales",
		header: "Gross Sales",
		cell: ({ row }) =>
			formatCurrency((row.original as CustomerDetailProduct).gross_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
	helper.display({
		id: "last",
		header: "Last",
		cell: ({ row }) => {
			const item = row.original as CustomerDetailProduct;
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
			const item = row.original as CustomerDetailCashier;
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
		cell: ({ row }) =>
			(row.original as CustomerDetailCashier).transaction_count,
		meta: { headClassName: "text-right", cellClassName: "text-right text-sm" },
	}),
	helper.display({
		id: "sales",
		header: "Total Sales",
		cell: ({ row }) =>
			formatCurrency((row.original as CustomerDetailCashier).total_sales),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
	helper.display({
		id: "last",
		header: "Last",
		cell: ({ row }) => {
			const item = row.original as CustomerDetailCashier;
			return item.last_transaction_at
				? formatDate(item.last_transaction_at)
				: "—";
		},
		meta: { cellClassName: "text-2xs text-text" },
	}),
]);

function columnsFor(view: CustomerDetailView) {
	if (view === "products") return productColumns;
	if (view === "cashiers") return cashierColumns;
	return transactionColumns;
}

export default function CustomerReportTable({
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
			label="Customer report"
			columns={columnsFor(view)}
			rows={rows}
			rowId={(row) => {
				if ("transaction_id" in row) return row.transaction_id;
				if ("product_id" in row) return row.product_id;
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
