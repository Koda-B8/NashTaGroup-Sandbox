import {
	createPaginatedRowModel,
	rowPaginationFeature,
	rowSelectionFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import Checkbox from "../ui/checkbox";

// callers must build their column helper with these same features
export const dataTableFeatures = tableFeatures({
	rowSelectionFeature,
	rowPaginationFeature,
	paginatedRowModel: createPaginatedRowModel(),
});

export interface DataTableProps<Row extends object> {
	columns: Parameters<
		typeof useTable<typeof dataTableFeatures, Row>
	>[0]["columns"];
	data: Row[];
	label: string;
	selectable?: boolean;
	pageSize?: number;
	unit?: string;
	activeRowId?: string;
	onRowClick?: (row: Row, id: string) => void;
}

export default function DataTable<Row extends object>({
	columns,
	data,
	label,
	selectable = false,
	pageSize = 10,
	unit = "rows",
	activeRowId,
	onRowClick,
}: DataTableProps<Row>) {
	const table = useTable(
		{
			features: dataTableFeatures,
			columns,
			data,
			initialState: { pagination: { pageIndex: 0, pageSize } },
		},
		(state) => ({
			rowSelection: state.rowSelection,
			pagination: state.pagination,
		}),
	);

	const rows = table.getRowModel().rows;
	const pageCount = table.getPageCount();
	const { pageIndex } = table.state.pagination;

	return (
		<div className="overflow-hidden rounded-xl border border-base-border bg-white">
			<div className="overflow-x-auto">
				<table
					className="w-full text-sm"
					aria-label={label}
				>
					<thead className="border-b border-base-border bg-base">
						{table.getHeaderGroups().map((group) => (
							<tr key={group.id}>
								{selectable && (
									<th
										scope="col"
										className="w-12 px-4 py-3"
									>
										<Checkbox
											checked={table.getIsAllPageRowsSelected()}
											indeterminate={table.getIsSomePageRowsSelected()}
											onCheckedChange={table.getToggleAllPageRowsSelectedHandler()}
											aria-label={`Select all ${unit} on this page`}
										/>
									</th>
								)}
								{group.headers.map((header) => (
									<th
										key={header.id}
										scope="col"
										className="px-4 py-3 text-left font-medium text-text"
									>
										{header.isPlaceholder ? undefined : (
											<table.FlexRender header={header} />
										)}
									</th>
								))}
							</tr>
						))}
					</thead>

					<tbody>
						{rows.map((row) => {
							const isActive = activeRowId === row.id;

							return (
								<tr
									key={row.id}
									onClick={() => onRowClick?.(row.original, row.id)}
									className={`border-b border-base-border last:border-b-0 ${
										isActive ? "bg-primary-light/50" : "hover:bg-base"
									} ${onRowClick ? "cursor-pointer" : ""}`}
								>
									{selectable && (
										<td className="px-4 py-4">
											<Checkbox
												checked={row.getIsSelected()}
												onCheckedChange={row.getToggleSelectedHandler()}
												aria-label={`Select row ${row.id}`}
											/>
										</td>
									)}
									{row.getAllCells().map((cell) => (
										<td
											key={cell.id}
											className="px-4 py-4 text-text-h"
										>
											<table.FlexRender cell={cell} />
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className="flex items-center justify-between border-t border-base-border px-4 py-3 text-sm text-text">
				<span>
					Showing {rows.length} of {data.length} {unit}
				</span>

				<div className="flex items-center gap-1">
					<PageButton
						label="Previous page"
						disabled={!table.getCanPreviousPage()}
						onClick={() => table.previousPage()}
					>
						<ChevronLeftIcon size={14} />
					</PageButton>

					{Array.from({ length: pageCount }, (_, page) => (
						<PageButton
							key={page}
							label={`Page ${page + 1}`}
							active={page === pageIndex}
							onClick={() => table.setPageIndex(page)}
						>
							{page + 1}
						</PageButton>
					))}

					<PageButton
						label="Next page"
						disabled={!table.getCanNextPage()}
						onClick={() => table.nextPage()}
					>
						<ChevronRightIcon size={14} />
					</PageButton>
				</div>
			</div>
		</div>
	);
}

function PageButton({
	children,
	label,
	active,
	disabled,
	onClick,
}: {
	children: ReactNode;
	label: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-current={active ? "page" : undefined}
			disabled={disabled}
			onClick={onClick}
			className={`flex size-8 items-center justify-center rounded-lg border text-xs ${
				active
					? "border-primary bg-primary text-white"
					: "border-base-border bg-white text-text-h hover:bg-base"
			} disabled:opacity-40`}
		>
			{children}
		</button>
	);
}
