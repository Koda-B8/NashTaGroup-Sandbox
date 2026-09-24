import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	type DataTableColumn,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import { dotColor } from "../../../libs/format";
import type { InventoryItem } from "../api";
import { STOCK_STATUS_TEXT } from "../format";
import StockStatusBadge from "./StockStatusBadge";

interface Props {
	loading: boolean;
	paged: InventoryItem[];
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

const COLUMNS: DataTableColumn<InventoryItem>[] = [
	{
		key: "product",
		header: "Product",
		cell: (row, active) => (
			<div className="flex items-center gap-2.5">
				<Avatar
					size="sm"
					shape="square"
					name={row.productName}
				/>
				<div className="min-w-0">
					<span
						className={`block truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
					>
						{row.productName}
					</span>
					<span
						className="block truncate text-2xs text-text"
						title={row.id}
					>
						{row.productCode || row.id}
					</span>
				</div>
			</div>
		),
	},
	{
		key: "variant",
		header: "Variant",
		cell: (row) => row.variantName || "—",
		cellClassName: "text-xs text-text",
	},
	{
		key: "brand",
		header: "Brand",
		cell: (row) => row.brand,
		cellClassName: "text-xs text-text",
	},
	{
		key: "category",
		header: "Category",
		cell: (row) => (
			<span className="inline-flex items-center gap-1.5 text-xs text-text">
				<span
					className="size-2 shrink-0 rounded-full"
					style={{ backgroundColor: dotColor(row.category) }}
					aria-hidden
				/>
				{row.category}
			</span>
		),
	},
	{
		key: "stock",
		header: "Stock",
		cell: (row) => (
			<span
				className={`text-sm font-semibold ${STOCK_STATUS_TEXT[row.stockStatus]}`}
			>
				{row.stock}
			</span>
		),
	},
	{
		key: "status",
		header: "Status",
		cell: (row) => <StockStatusBadge status={row.stockStatus} />,
	},
];

export default function InventoryTable({
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
			label="Inventory"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat inventory..."
			emptyLabel="No inventory found."
			activeId={selectedId}
			onRowClick={(row) => onSelect(row.id)}
			selectedIds={selectedIds}
			allPageSelected={allPageSelected}
			somePageSelected={somePageSelected}
			onToggleAll={onToggleAll}
			onToggleOne={onToggleOne}
			selectAllLabel="Select all inventory on this page"
			rowSelectLabel={(row) => `Select ${row.productName}`}
			actions={(row) => (
				<ActionMenu
					label={`Actions for ${row.productName}`}
					items={[{ label: "View detail", onSelect: () => onSelect(row.id) }]}
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
