import PaginationControls from "../../../components/PaginationControls";
import DataTable, {
	createTableColumnHelper,
	type TableMeta,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { formatDate, getRoleName } from "../../../libs/format";
import type { User } from "../api";

interface Props {
	loading: boolean;
	paged: User[];
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

const helper = createTableColumnHelper<User>();

const COLUMNS = helper.columns([
	helper.accessor("fullname", {
		header: "Name",
		cell: ({ row, table }) => {
			const active =
				(table.options.meta as TableMeta | undefined)?.activeId ===
				row.original.id;
			return (
				<div className="flex items-center gap-2.5">
					<Avatar
						name={row.original.fullname}
						size="sm"
					/>
					<div className="min-w-0">
						<p
							className={`truncate text-sm font-medium ${active ? "text-primary" : "text-text-h"}`}
						>
							{row.original.fullname}
						</p>
						<p className="truncate text-2xs text-text">
							{row.original.id.slice(0, 8)}…
						</p>
					</div>
				</div>
			);
		},
	}),
	helper.accessor("username", {
		header: "Username",
		meta: { cellClassName: "text-sm text-text-h" },
	}),
	helper.accessor("role", {
		header: "Role",
		cell: ({ row }) => (
			<Badge
				variant={
					getRoleName(row.original.role) === "admin" ? "info" : "neutral"
				}
				size="sm"
			>
				{getRoleName(row.original.role)}
			</Badge>
		),
	}),
	helper.accessor("isActive", {
		header: "Status",
		cell: ({ row }) => <ActiveBadge isActive={row.original.isActive} />,
	}),
	helper.accessor("createdAt", {
		header: "Created",
		cell: ({ row }) => formatDate(row.original.createdAt),
		meta: { cellClassName: "text-sm text-text" },
	}),
]);

export default function UserTable({
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
			label="Users"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat users..."
			emptyLabel="No users found."
			activeId={selectedId}
			onRowClick={(row) => onSelect(row.id)}
			selectedIds={selectedIds}
			allPageSelected={allPageSelected}
			somePageSelected={somePageSelected}
			onToggleAll={onToggleAll}
			onToggleOne={onToggleOne}
			selectAllLabel="Select all users on this page"
			rowSelectLabel={(row) => `Select ${row.fullname}`}
			actions={(row) => {
				const status = row.is_active ? "Active" : "Inactive";
				return (
					<ActionMenu
						label={`Actions for ${row.fullname}`}
						items={[
							{ label: "View detail", onSelect: () => onSelect(row.id) },
							{ label: "Edit", onSelect: () => onSelect(row.id) },
							{
								label: status === "Active" ? "Deactivate" : "Activate",
								onSelect: () => {},
								danger: status === "Active",
							},
						]}
					/>
				);
			}}
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
