import {
	type PaginationState,
	type RowData,
	createColumnHelper,
	rowPaginationFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import PaginationControls from "../PaginationControls";
import Card from "../ui/card";
import Checkbox from "../ui/checkbox";

// manual pagination: the server already paginated, so no paginatedRowModel.
// page state stays in usePaginatedList and is passed in controlled.
export const tableFeatures_ = tableFeatures({ rowPaginationFeature });

export type TableFeatures = typeof tableFeatures_;

export function createTableColumnHelper<Row extends RowData>() {
	return createColumnHelper<TableFeatures, Row>();
}

export interface TableMeta {
	activeId?: string | undefined;
}

const HEAD_CELL =
	"px-3 py-3 text-2xs font-semibold tracking-wide text-text uppercase";

type Columns<Row extends RowData> = Parameters<
	typeof useTable<TableFeatures, Row>
>[0]["columns"];

export interface DataTableProps<Row extends RowData> {
	label: string;
	columns: Columns<Row>;
	rows: Row[];
	rowId: (row: Row) => string;
	loading: boolean;
	loadingLabel: string;
	emptyLabel: string;
	tableClassName?: string;

	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
	pageSize?: number;

	activeId?: string | undefined;
	onRowClick?: (row: Row) => void;

	selectedIds?: Set<string>;
	allPageSelected?: boolean;
	somePageSelected?: boolean;
	onToggleAll?: (checked: boolean) => void;
	onToggleOne?: (id: string, checked: boolean) => void;
	selectAllLabel?: string;
	rowSelectLabel?: (row: Row) => string;

	actions?: (row: Row) => ReactNode;
}

export default function DataTable<Row extends RowData>({
	label,
	columns,
	rows,
	rowId,
	loading,
	loadingLabel,
	emptyLabel,
	tableClassName = "",
	pageCount,
	safePage,
	onPageChange,
	totalLabel,
	pageSize = 10,
	activeId,
	onRowClick,
	selectedIds,
	allPageSelected = false,
	somePageSelected = false,
	onToggleAll,
	onToggleOne,
	selectAllLabel,
	rowSelectLabel,
	actions,
}: DataTableProps<Row>) {
	const table = useTable({
		features: tableFeatures_,
		columns,
		data: rows,
		manualPagination: true,
		pageCount,
		state: { pagination: { pageIndex: safePage, pageSize } },
		onPaginationChange: (updater) => {
			const next: PaginationState =
				typeof updater === "function"
					? updater({ pageIndex: safePage, pageSize })
					: updater;
			onPageChange(next.pageIndex);
		},
		meta: { activeId } satisfies TableMeta,
	});

	const selectable = Boolean(onToggleOne && selectedIds);
	const modelRows = table.getRowModel().rows;
	const colSpan =
		table.getAllLeafColumns().length + (selectable ? 1 : 0) + (actions ? 1 : 0);

	// the checkbox and the action menu sit inside the row, so using them must not
	// also open the row's detail panel
	const stop = (event: MouseEvent) => event.stopPropagation();

	return (
		<Card
			padding="none"
			className="overflow-hidden"
		>
			<div className="overflow-x-auto">
				<table
					className={`w-full text-left text-sm ${tableClassName}`.trim()}
					aria-label={label}
				>
					<thead className="border-b border-base-border bg-base">
						{table.getHeaderGroups().map((group) => (
							<tr key={group.id}>
								{selectable && (
									<th
										scope="col"
										className="w-10 px-3 py-3"
									>
										<Checkbox
											checked={allPageSelected}
											indeterminate={somePageSelected}
											onCheckedChange={(c) => onToggleAll?.(c === true)}
											aria-label={selectAllLabel ?? "Select all on this page"}
										/>
									</th>
								)}
								{group.headers.map((header) => (
									<th
										key={header.id}
										scope="col"
										className={`${HEAD_CELL} ${
											(
												header.column.columnDef.meta as
													| { headClassName?: string }
													| undefined
											)?.headClassName ?? ""
										}`.trim()}
									>
										{header.isPlaceholder ? undefined : (
											<table.FlexRender header={header} />
										)}
									</th>
								))}
								{actions && (
									<th
										scope="col"
										className="w-10 px-3 py-3"
										aria-label="Actions"
									/>
								)}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-base-border">
						{loading || modelRows.length === 0 ? (
							<tr>
								<td
									colSpan={colSpan}
									className="px-4 py-10 text-center text-sm text-text"
								>
									{loading ? loadingLabel : emptyLabel}
								</td>
							</tr>
						) : (
							modelRows.map((row) => {
								const id = rowId(row.original);
								const active = id === activeId;

								return (
									<tr
										key={row.id}
										onClick={
											onRowClick ? () => onRowClick(row.original) : undefined
										}
										onKeyDown={
											onRowClick
												? (event: KeyboardEvent<HTMLTableRowElement>) => {
														if (event.key !== "Enter" && event.key !== " ")
															return;
														if (event.target !== event.currentTarget) return;
														event.preventDefault();
														onRowClick(row.original);
													}
												: undefined
										}
										tabIndex={onRowClick ? 0 : undefined}
										className={`focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
											onRowClick ? "cursor-pointer" : ""
										} ${active ? "bg-primary-light/50" : "hover:bg-base/60"}`}
									>
										{selectable && (
											<td
												className="px-3 py-3"
												onClick={stop}
											>
												<Checkbox
													checked={selectedIds?.has(id)}
													onCheckedChange={(c) => onToggleOne?.(id, c === true)}
													aria-label={
														rowSelectLabel?.(row.original) ?? "Select row"
													}
												/>
											</td>
										)}
										{row.getAllCells().map((cell) => (
											<td
												key={cell.id}
												className={`px-3 py-3 ${
													(
														cell.column.columnDef.meta as
															| { cellClassName?: string }
															| undefined
													)?.cellClassName ?? ""
												}`.trim()}
											>
												<table.FlexRender cell={cell} />
											</td>
										))}
										{actions && (
											<td
												className="px-3 py-3"
												onClick={stop}
											>
												{actions(row.original)}
											</td>
										)}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
			<PaginationControls
				totalLabel={totalLabel}
				pageCount={table.getPageCount()}
				safePage={table.state.pagination.pageIndex}
				canPreviousPage={table.getCanPreviousPage()}
				canNextPage={table.getCanNextPage()}
				onPrevious={() => table.previousPage()}
				onNext={() => table.nextPage()}
				onPageChange={(page) => table.setPageIndex(page)}
			/>
		</Card>
	);
}
