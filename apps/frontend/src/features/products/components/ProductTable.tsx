import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	type DataTableColumn,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import { dotColor } from "../../../libs/format";
import type { Product } from "../api";
import { priceLabel, stockTone, toNumber } from "../format";
import StatusBadge from "./StatusBadge";

function VariantPill({ count }: { count: number }) {
	return (
		<span className="inline-flex h-5 min-w-11 items-center justify-center rounded-full border border-base-border bg-base px-2 text-2xs font-medium text-text">
			{count} varian
		</span>
	);
}

interface Props {
	loading: boolean;
	paged: Product[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onOpenDetail: (product: Product) => void;
	onEdit: (product: Product) => void;
	onDelete: (product: Product) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	totalLabel: string;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
}

const COLUMNS: DataTableColumn<Product>[] = [
	{
		key: "product",
		header: "Product",
		cell: (row, active) => (
			<div className="flex items-center gap-2.5">
				<Avatar
					size="sm"
					shape="square"
					src={row.image?.url ?? undefined}
					alt={row.image?.alt ?? row.name}
					name={row.name}
				/>
				<div className="min-w-0">
					<span
						className={`block truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
					>
						{row.name}
					</span>
					<span
						className="block truncate text-2xs text-text"
						title={row.id}
					>
						{row.description ?? row.id}
					</span>
				</div>
			</div>
		),
	},
	{
		key: "category",
		header: "Category",
		cell: (row) => (
			<span className="inline-flex items-center gap-1.5 text-xs text-text">
				<span
					className="size-2 shrink-0 rounded-full"
					style={{ backgroundColor: dotColor(row.category?.name ?? "—") }}
					aria-hidden
				/>
				{row.category?.name ?? "—"}
			</span>
		),
	},
	{
		key: "brand",
		header: "Brand",
		cell: (row) => row.brand?.name ?? "—",
		cellClassName: "text-xs text-text",
	},
	{
		key: "variant",
		header: "Variant",
		cell: (row) => <VariantPill count={(row.items ?? []).length} />,
	},
	{
		key: "stock",
		header: "Stock",
		cell: (row) => {
			const stock = toNumber(row.stock);
			return (
				<span className={`text-sm font-semibold ${stockTone(stock).className}`}>
					{stock}
				</span>
			);
		},
	},
	{
		key: "price",
		header: "Price",
		cell: (row) => priceLabel(row.items ?? []),
		headClassName: "text-right",
		cellClassName: "text-right text-sm font-semibold text-text-h",
	},
	{
		key: "status",
		header: "Status",
		cell: (row) => <StatusBadge isActive={row.isActive} />,
	},
];

export default function ProductTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onOpenDetail,
	onEdit,
	onDelete,
	onToggleAll,
	onToggleOne,
	totalLabel,
	pageCount,
	safePage,
	onPageChange,
}: Props) {
	return (
		<DataTable
			label="Products"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat products..."
			emptyLabel="No products found."
			activeId={selectedId}
			onRowClick={onOpenDetail}
			selectedIds={selectedIds}
			allPageSelected={allPageSelected}
			somePageSelected={somePageSelected}
			onToggleAll={onToggleAll}
			onToggleOne={onToggleOne}
			selectAllLabel="Select all products on this page"
			rowSelectLabel={(row) => `Select ${row.name}`}
			actions={(row) => (
				<ActionMenu
					label={`Actions for ${row.name}`}
					items={[
						{ label: "Edit", onSelect: () => onEdit(row) },
						{ label: "Delete", onSelect: () => onDelete(row), danger: true },
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
