import {
	createPaginatedRowModel,
	rowPaginationFeature,
	rowSelectionFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { type MouseEvent, type ReactNode, useCallback } from "react";

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
	const goToPage = useCallback(
		(page: number) => table.setPageIndex(page),
		[table],
	);

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
						{rows.map((row) => (
							<TableRow
								key={row.id}
								row={row}
								table={table}
								selectable={selectable}
								active={activeRowId === row.id}
								onRowClick={onRowClick}
							/>
						))}
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
						page={pageIndex - 1}
						disabled={!table.getCanPreviousPage()}
						onSelect={goToPage}
					>
						<ChevronLeftIcon size={14} />
					</PageButton>

					{Array.from({ length: pageCount }, (_, page) => (
						<PageButton
							key={page}
							label={`Page ${page + 1}`}
							page={page}
							active={page === pageIndex}
							onSelect={goToPage}
						>
							{page + 1}
						</PageButton>
					))}

					<PageButton
						label="Next page"
						page={pageIndex + 1}
						disabled={!table.getCanNextPage()}
						onSelect={goToPage}
					>
						<ChevronRightIcon size={14} />
					</PageButton>
				</div>
			</div>
		</div>
	);
}

type TableInstance<Row extends object> = ReturnType<
	typeof useTable<typeof dataTableFeatures, Row>
>;

type TableRowModel<Row extends object> = ReturnType<
	TableInstance<Row>["getRowModel"]
>["rows"][number];

function TableRow<Row extends object>({
	row,
	table,
	selectable,
	active,
	onRowClick,
}: {
	row: TableRowModel<Row>;
	table: TableInstance<Row>;
	selectable: boolean;
	active: boolean;
	onRowClick?: (row: Row, id: string) => void;
}) {
	const handleClick = useCallback(
		() => onRowClick?.(row.original, row.id),
		[onRowClick, row],
	);
	// the checkbox sits inside the row, so selecting must not also open it
	const stopPropagation = useCallback((event: MouseEvent) => {
		event.stopPropagation();
	}, []);

	return (
		<tr
			onClick={handleClick}
			className={`border-b border-base-border last:border-b-0 ${
				active ? "bg-primary-light/50" : "hover:bg-base"
			} ${onRowClick ? "cursor-pointer" : ""}`}
		>
			{selectable && (
				<td
					className="px-4 py-4"
					onClick={stopPropagation}
				>
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
}

function PageButton({
	children,
	label,
	page,
	active,
	disabled,
	onSelect,
}: {
	children: ReactNode;
	label: string;
	page: number;
	active?: boolean;
	disabled?: boolean;
	onSelect: (page: number) => void;
}) {
	const handleClick = useCallback(() => onSelect(page), [onSelect, page]);

	return (
		<button
			type="button"
			aria-label={label}
			aria-current={active ? "page" : undefined}
			disabled={disabled}
			onClick={handleClick}
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
