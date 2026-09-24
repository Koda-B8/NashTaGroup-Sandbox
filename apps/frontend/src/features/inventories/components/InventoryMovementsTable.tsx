import DataTable, {
	createTableColumnHelper,
	type TableMeta,
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

const helper = createTableColumnHelper<InventoryMovement>();

const COLUMNS = helper.columns([
	helper.display({
		id: "product",
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
						name={row.original.productItem.productName}
					/>
					<div className="min-w-0">
						<span
							className={`block truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
						>
							{row.original.productItem.productName}
						</span>
						<span
							className="block truncate text-2xs text-text"
							title={row.original.productItem.id}
						>
							{row.original.productItem.productCode ||
								row.original.productItem.variantName ||
								"—"}
						</span>
					</div>
				</div>
			);
		},
	}),
	helper.accessor("type", {
		header: "Type",
		cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
	}),
	helper.accessor("quantity", {
		header: "Qty",
		cell: ({ row }) => (
			<span
				className={`text-sm font-semibold ${MOVEMENT_TYPE_TEXT[row.original.type]}`}
			>
				{formatMovementQuantity(row.original.type, row.original.quantity)}
			</span>
		),
	}),
	helper.display({
		id: "stock",
		header: "Stock",
		cell: ({ row }) => (
			<>
				<span className="font-medium text-text-h">
					{row.original.stockBefore}
				</span>
				<span
					className="mx-1 text-text"
					aria-hidden
				>
					→
				</span>
				<span className="font-medium text-text-h">
					{row.original.stockAfter}
				</span>
			</>
		),
		meta: { cellClassName: "text-xs whitespace-nowrap text-text" },
	}),
	helper.accessor("source", {
		header: "Source",
		cell: ({ row }) => <MovementSourceBadge source={row.original.source} />,
	}),
	helper.display({
		id: "transaction",
		header: "Transaction",
		cell: ({ row }) =>
			row.original.transaction ? (
				<span
					className="font-medium text-text-h"
					title={row.original.transaction.transactionNumber}
				>
					{row.original.transaction.transactionNumber}
				</span>
			) : (
				<span className="text-text">—</span>
			),
		meta: { cellClassName: "text-xs whitespace-nowrap" },
	}),
	helper.display({
		id: "by",
		header: "By",
		cell: ({ row }) => row.original.performedBy?.fullname ?? "—",
		meta: { cellClassName: "text-xs whitespace-nowrap text-text" },
	}),
	helper.accessor("createdAt", {
		header: "Date",
		cell: ({ row }) => formatDateTime(row.original.createdAt),
		meta: { cellClassName: "text-2xs whitespace-nowrap text-text" },
	}),
]);

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
			pageCount={pageCount}
			safePage={safePage}
			onPageChange={onPageChange}
			totalLabel={totalLabel}
		/>
	);
}
