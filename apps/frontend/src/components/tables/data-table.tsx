import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import Card from "../ui/card";
import Checkbox from "../ui/checkbox";

const HEAD_CELL =
	"px-3 py-3 text-2xs font-semibold tracking-wide text-text uppercase";

export interface DataTableColumn<Row> {
	key: string;
	header?: ReactNode;
	cell: (row: Row, active: boolean) => ReactNode;
	headClassName?: string;
	cellClassName?: string;
}

export interface DataTableProps<Row> {
	label: string;
	columns: DataTableColumn<Row>[];
	rows: Row[];
	rowId: (row: Row) => string;
	loading: boolean;
	loadingLabel: string;
	emptyLabel: string;
	tableClassName?: string;
	footer?: ReactNode;

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

export default function DataTable<Row>({
	label,
	columns,
	rows,
	rowId,
	loading,
	loadingLabel,
	emptyLabel,
	tableClassName = "",
	footer,
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
	const selectable = Boolean(onToggleOne && selectedIds);
	const colSpan = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

	// the checkbox and the action menu live inside the row, so using them must
	// not also open the row's detail panel
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
						<tr>
							{selectable && (
								<th
									scope="col"
									className="w-10 px-3 py-3"
								>
									<Checkbox
										checked={allPageSelected}
										indeterminate={somePageSelected}
										onCheckedChange={(c) => onToggleAll?.(c === true)}
										aria-label={selectAllLabel ?? `Select all on this page`}
									/>
								</th>
							)}
							{columns.map((column) => (
								<th
									key={column.key}
									scope="col"
									className={`${HEAD_CELL} ${column.headClassName ?? ""}`.trim()}
								>
									{column.header}
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
					</thead>
					<tbody className="divide-y divide-base-border">
						{loading || rows.length === 0 ? (
							<tr>
								<td
									colSpan={colSpan}
									className="px-4 py-10 text-center text-sm text-text"
								>
									{loading ? loadingLabel : emptyLabel}
								</td>
							</tr>
						) : (
							rows.map((row) => {
								const id = rowId(row);
								const active = id === activeId;

								return (
									<tr
										key={id}
										onClick={onRowClick ? () => onRowClick(row) : undefined}
										onKeyDown={
											onRowClick
												? (event: KeyboardEvent<HTMLTableRowElement>) => {
														if (event.key !== "Enter" && event.key !== " ")
															return;
														if (event.target !== event.currentTarget) return;
														event.preventDefault();
														onRowClick(row);
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
													aria-label={rowSelectLabel?.(row) ?? `Select row`}
												/>
											</td>
										)}
										{columns.map((column) => (
											<td
												key={column.key}
												className={`px-3 py-3 ${column.cellClassName ?? ""}`.trim()}
											>
												{column.cell(row, active)}
											</td>
										))}
										{actions && (
											<td
												className="px-3 py-3"
												onClick={stop}
											>
												{actions(row)}
											</td>
										)}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
			{footer}
		</Card>
	);
}
