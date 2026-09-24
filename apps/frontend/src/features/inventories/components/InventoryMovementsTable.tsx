import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	type DataTableColumn,
} from "../../../components/tables/data-table";
import Avatar from "../../../components/ui/avatar";
import type { InventoryMovement } from "../api";
import {
	formatDateTime,
	formatMovementQuantity,
	MOVEMENT_TYPE_TEXT,
} from "../format";
import MovementSourceBadge from "./MovementSourceBadge";
import MovementTypeBadge from "./MovementTypeBadge";

interface Props {
	loading: boolean;
	paged: InventoryMovement[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

const COLUMNS: DataTableColumn<InventoryMovement>[] = [
	{
		key: "product",
		header: "Product",
		cell: (row, active) => (
			<div className="flex items-center gap-2.5">
				<Avatar
					size="sm"
					shape="square"
					name={row.productItem.productName}
				/>
				<div className="min-w-0">
					<span
						className={`block truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
					>
						{row.productItem.productName}
					</span>
					<span
						className="block truncate text-2xs text-text"
						title={row.productItem.id}
					>
						{row.productItem.productCode || row.productItem.variantName || "—"}
					</span>
				</div>
			</div>
		),
	},
	{
		key: "type",
		header: "Type",
		cell: (row) => <MovementTypeBadge type={row.type} />,
	},
	{
		key: "qty",
		header: "Qty",
		cell: (row) => (
			<span className={`text-sm font-semibold ${MOVEMENT_TYPE_TEXT[row.type]}`}>
				{formatMovementQuantity(row.type, row.quantity)}
			</span>
		),
	},
	{
		key: "stock",
		header: "Stock",
		cell: (row) => (
			<>
				<span className="font-medium text-text-h">{row.stockBefore}</span>
				<span
					className="mx-1 text-text"
					aria-hidden
				>
					→
				</span>
				<span className="font-medium text-text-h">{row.stockAfter}</span>
			</>
		),
		cellClassName: "text-xs whitespace-nowrap text-text",
	},
	{
		key: "source",
		header: "Source",
		cell: (row) => <MovementSourceBadge source={row.source} />,
	},
	{
		key: "transaction",
		header: "Transaction",
		cell: (row) =>
			row.transaction ? (
				<span
					className="font-medium text-text-h"
					title={row.transaction.transactionNumber}
				>
					{row.transaction.transactionNumber}
				</span>
			) : (
				<span className="text-text">—</span>
			),
		cellClassName: "text-xs whitespace-nowrap",
	},
	{
		key: "by",
		header: "By",
		cell: (row) => row.performedBy?.fullname ?? "—",
		cellClassName: "text-xs whitespace-nowrap text-text",
	},
	{
		key: "date",
		header: "Date",
		cell: (row) => formatDateTime(row.createdAt),
		cellClassName: "text-2xs whitespace-nowrap text-text",
	},
];

export default function InventoryMovementsTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onSelect,
	onToggleAll,
	onToggleOne,
	pageCount,
	safePage,
	onPageChange,
	totalLabel,
}: Props) {
	return (
		<DataTable
			label="Inventory movements"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat riwayat inventory..."
			emptyLabel="No inventory movements found."
			tableClassName="min-w-[880px]"
			activeId={selectedId}
			onRowClick={(row) => onSelect(row.id)}
			selectedIds={selectedIds}
			allPageSelected={allPageSelected}
			somePageSelected={somePageSelected}
			onToggleAll={onToggleAll}
			onToggleOne={onToggleOne}
			selectAllLabel="Select all movements on this page"
			rowSelectLabel={(row) =>
				`Select movement for ${row.productItem.productName}`
			}
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
