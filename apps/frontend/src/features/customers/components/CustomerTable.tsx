import DataTable, {
	createTableColumnHelper,
} from "../../../components/tables/data-table";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import { formatDate } from "../../../libs/format";
import type { Customer } from "../api";

interface Props {
	loading: boolean;
	paged: Customer[];
	onViewDetail: (customer: Customer) => void;
	onViewReport?: (customer: Customer) => void;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

const helper = createTableColumnHelper<Customer>();

const COLUMNS = helper.columns([
	helper.accessor("name", {
		header: "Name",
		cell: ({ row }) => (
			<div className="flex items-center gap-2.5">
				<Avatar
					name={row.original.name}
					size="sm"
				/>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-text-h">
						{row.original.name}
					</p>
					<p className="truncate text-2xs text-text">
						{row.original.id.slice(0, 8)}…
					</p>
				</div>
			</div>
		),
	}),
	helper.accessor("phone", {
		header: "Phone",
		meta: { cellClassName: "text-sm text-text-h" },
	}),
	helper.accessor("createdAt", {
		header: "Joined",
		cell: ({ row }) => formatDate(row.original.createdAt),
		meta: { cellClassName: "text-sm text-text" },
	}),
]);

export default function CustomerTable({
	loading,
	paged,
	onViewDetail,
	onViewReport,
	pageCount,
	safePage,
	onPageChange,
	totalLabel,
}: Props) {
	return (
		<DataTable
			label="Customers"
			columns={COLUMNS}
			rows={paged}
			rowId={(row) => row.id}
			loading={loading}
			loadingLabel="Memuat customers..."
			emptyLabel="No customers found."
			onRowClick={onViewDetail}
			actions={(row) => (
				<ActionMenu
					label={`Actions for ${row.name}`}
					items={[
						{ label: "View detail", onSelect: () => onViewDetail(row) },
						...(onViewReport
							? [
									{
										label: "Transaction Report",
										onSelect: () => onViewReport(row),
									},
								]
							: []),
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
