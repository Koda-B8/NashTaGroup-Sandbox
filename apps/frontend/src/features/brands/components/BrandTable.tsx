import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	type DataTableColumn,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { dotColor, formatDate } from "../../../libs/format";
import type { Brand } from "../api";

interface Props {
	loading: boolean;
	paged: Brand[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onEdit: (brand: Brand) => void;
	onDelete: (brand: Brand) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

const COLUMNS: DataTableColumn<Brand>[] = [
	{
		key: "name",
		header: "Name",
		cell: (row, active) => (
			<div className="flex items-center gap-2.5">
				<span
					className="size-2.5 shrink-0 rounded-full"
					style={{ backgroundColor: dotColor(row.name) }}
					aria-hidden
				/>
				<span
					className={`text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
				>
					{row.name}
				</span>
			</div>
		),
	},
	{
		key: "status",
		header: "Status",
		cell: (row) => <ActiveBadge isActive={row.isActive} />,
	},
	{
		key: "created",
		header: "Created",
		cell: (row) => formatDate(row.createdAt),
		cellClassName: "text-sm text-text",
	},
	{
		key: "updated",
		header: "Last Updated",
		cell: (row) => formatDate(row.updatedAt),
		cellClassName: "text-sm text-text",
	},
];

export default function BrandTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onSelect,
	onEdit,
	onDelete,
	onToggleAll,
	onToggleOne,
	pageCount,
	safePage,
	onPageChange,
	totalLabel,
}: Props) {
	return (
		<DataTable
			label="Brands"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat brands..."
			emptyLabel="No brands found."
			activeId={selectedId}
			onRowClick={(row) => onSelect(row.id)}
			selectedIds={selectedIds}
			allPageSelected={allPageSelected}
			somePageSelected={somePageSelected}
			onToggleAll={onToggleAll}
			onToggleOne={onToggleOne}
			selectAllLabel="Select all brands on this page"
			rowSelectLabel={(row) => `Select ${row.name}`}
			actions={(row) => (
				<ActionMenu
					label={`Actions for ${row.name}`}
					items={[
						{ label: "View detail", onSelect: () => onSelect(row.id) },
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
