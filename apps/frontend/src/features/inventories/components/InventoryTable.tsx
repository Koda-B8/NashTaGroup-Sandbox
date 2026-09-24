import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	createTableColumnHelper,
	type TableMeta,
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

const helper = createTableColumnHelper<InventoryItem>();

const COLUMNS = helper.columns([
	helper.accessor("productName", {
		header: "Product",
		cell: ({ row, table }) => {
			const active =
				(table.options.meta as TableMeta | undefined)?.activeId ===
				row.original.id;
			return (
				<div className="flex items-center gap-2.5">
					<Avatar
						size="sm"
						shape="square"
						name={row.original.productName}
					/>
					<div className="min-w-0">
						<span
							className={`block truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
						>
							{row.original.productName}
						</span>
						<span
							className="block truncate text-2xs text-text"
							title={row.original.id}
						>
							{row.original.productCode || row.original.id}
						</span>
					</div>
				</div>
			);
		},
	}),
	helper.accessor("variantName", {
		header: "Variant",
		cell: ({ row }) => row.original.variantName || "—",
		meta: { cellClassName: "text-xs text-text" },
	}),
	helper.accessor("brand", {
		header: "Brand",
		meta: { cellClassName: "text-xs text-text" },
	}),
	helper.accessor("category", {
		header: "Category",
		cell: ({ row }) => (
			<span className="inline-flex items-center gap-1.5 text-xs text-text">
				<span
					className="size-2 shrink-0 rounded-full"
					style={{ backgroundColor: dotColor(row.original.category) }}
					aria-hidden
				/>
				{row.original.category}
			</span>
		),
	}),
	helper.accessor("stock", {
		header: "Stock",
		cell: ({ row }) => (
			<span
				className={`text-sm font-semibold ${STOCK_STATUS_TEXT[row.original.stockStatus]}`}
			>
				{row.original.stock}
			</span>
		),
	}),
	helper.accessor("stockStatus", {
		header: "Status",
		cell: ({ row }) => <StockStatusBadge status={row.original.stockStatus} />,
	}),
]);

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
