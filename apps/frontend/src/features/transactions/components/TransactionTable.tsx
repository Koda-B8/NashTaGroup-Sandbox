import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	type DataTableColumn,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import { formatDate } from "../../../libs/format";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { Transaction } from "../api";
import { paymentStatusVariant, toNumber } from "../format";
import TransactionStatusBadge from "./TransactionStatusBadge";

interface Props {
	loading: boolean;
	paged: Transaction[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onOpenDetail: (transaction: Transaction) => void;
	onCopyNumber: (value: string) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	totalLabel: string;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
}

const COLUMNS: DataTableColumn<Transaction>[] = [
	{
		key: "transaction",
		header: "Transaction",
		cell: (row, active) => (
			<>
				<p
					className={`truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
					title={row.transactionNumber}
				>
					{row.transactionNumber}
				</p>
				<p className="truncate text-2xs text-text">
					{row.cashier?.fullname ?? "—"}
				</p>
			</>
		),
	},
	{
		key: "customer",
		header: "Customer",
		cell: (row) => (
			<div className="flex items-center gap-2">
				<Avatar
					name={row.customer?.name ?? "Non-member"}
					size="sm"
				/>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-text-h">
						{row.customer?.name ?? "Non-member"}
					</p>
					<p className="truncate text-2xs text-text">
						{row.customer?.phone ?? "Guest checkout"}
					</p>
				</div>
			</div>
		),
	},
	{
		key: "payment",
		header: "Payment",
		cell: (row) => (
			<>
				<p className="truncate text-sm text-text-h">
					{row.payment.method ?? "—"}
				</p>
				{row.payment.status && (
					<Badge
						variant={paymentStatusVariant(row.payment.status)}
						size="sm"
						className="mt-1"
					>
						{row.payment.status}
					</Badge>
				)}
			</>
		),
	},
	{
		key: "total",
		header: "Total",
		cell: (row) => formatRupiah(toNumber(row.totalAmount)),
		headClassName: "text-right",
		cellClassName:
			"text-right text-sm font-medium whitespace-nowrap text-text-h",
	},
	{
		key: "date",
		header: "Date",
		cell: (row) => formatDate(row.createdAt),
		cellClassName: "text-2xs whitespace-nowrap text-text",
	},
	{
		key: "status",
		header: "Status",
		cell: (row) => <TransactionStatusBadge status={row.status} />,
	},
];

export default function TransactionTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onSelect,
	onOpenDetail,
	onCopyNumber,
	onToggleAll,
	onToggleOne,
	totalLabel,
	pageCount,
	safePage,
	onPageChange,
}: Props) {
	return (
		<DataTable
			label="Transactions"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat transaksi..."
			emptyLabel="No transactions found."
			tableClassName="min-w-[800px]"
			activeId={selectedId}
			onRowClick={(row) => onSelect(row.id)}
			selectedIds={selectedIds}
			allPageSelected={allPageSelected}
			somePageSelected={somePageSelected}
			onToggleAll={onToggleAll}
			onToggleOne={onToggleOne}
			selectAllLabel="Select all transactions on this page"
			rowSelectLabel={(row) => `Select ${row.transactionNumber}`}
			actions={(row) => (
				<ActionMenu
					label={`Actions for ${row.transactionNumber}`}
					items={[
						{ label: "View detail", onSelect: () => onOpenDetail(row) },
						{
							label: "Copy number",
							onSelect: () => onCopyNumber(row.transactionNumber),
						},
					]}
				/>
			)}
			footer={
				<PaginationControls
					totalLabel={totalLabel}
					pageCount={pageCount}
					safePage={safePage}
					onPageChange={onPageChange}
				/>
			}
		/>
	);
}
