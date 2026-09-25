import DataTable, {
	createTableColumnHelper,
	type TableMeta,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { dotColor } from "../../../libs/format";
import type { Product } from "../api";
import { priceLabel, stockTone, toNumber } from "../format";

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

const helper = createTableColumnHelper<Product>();

const COLUMNS = helper.columns([
	helper.accessor("name", {
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
						src={row.original.image?.url ?? undefined}
						alt={row.original.image?.alt ?? row.original.name}
						name={row.original.name}
					/>
					<div className="min-w-0">
						<span
							className={`block truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
						>
							{row.original.name}
						</span>
						<span
							className="block truncate text-2xs text-text"
							title={row.original.id}
						>
							{row.original.description ?? row.original.id}
						</span>
					</div>
				</div>
			);
		},
	}),
	helper.display({
		id: "category",
		header: "Category",
		cell: ({ row }) => (
			<span className="inline-flex items-center gap-1.5 text-xs text-text">
				<span
					className="size-2 shrink-0 rounded-full"
					style={{
						backgroundColor: dotColor(row.original.category?.name ?? "—"),
					}}
					aria-hidden
				/>
				{row.original.category?.name ?? "—"}
			</span>
		),
	}),
	helper.display({
		id: "brand",
		header: "Brand",
		cell: ({ row }) => row.original.brand?.name ?? "—",
		meta: { cellClassName: "text-xs text-text" },
	}),
	helper.display({
		id: "variant",
		header: "Variant",
		cell: ({ row }) => (
			<VariantPill count={(row.original.items ?? []).length} />
		),
	}),
	helper.accessor("stock", {
		header: "Stock",
		cell: ({ row }) => {
			const stock = toNumber(row.original.stock);
			return (
				<span className={`text-sm font-semibold ${stockTone(stock).className}`}>
					{stock}
				</span>
			);
		},
	}),
	helper.display({
		id: "price",
		header: "Price",
		cell: ({ row }) => priceLabel(row.original.items ?? []),
		meta: {
			headClassName: "text-right",
			cellClassName: "text-right text-sm font-semibold text-text-h",
		},
	}),
	helper.accessor("isActive", {
		header: "Status",
		cell: ({ row }) => <ActiveBadge isActive={row.original.isActive} />,
	}),
]);

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
			pageCount={pageCount}
			safePage={safePage}
			onPageChange={onPageChange}
			totalLabel={totalLabel}
		/>
	);
}
