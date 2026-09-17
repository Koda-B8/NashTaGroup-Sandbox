import PaginationControls from "../../../components/PaginationControls";
import ActionMenu from "../../../components/ui/action-menu";
import Card from "../../../components/ui/card";
import Checkbox from "../../../components/ui/checkbox";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { dotColor, formatDate } from "../../../libs/format";
import type { Category } from "../api";

interface Props {
	loading: boolean;
	paged: Category[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

const HEAD_CELL = "px-3 py-3 text-xs font-semibold text-text";

export default function CategoryTable({
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
		<Card
			padding="none"
			className="overflow-hidden"
		>
			<div className="overflow-x-auto">
				<table
					className="w-full text-left text-sm"
					aria-label="Categories"
				>
					<thead className="border-b border-base-border bg-base">
						<tr>
							<th
								scope="col"
								className="w-10 px-3 py-3"
							>
								<Checkbox
									checked={allPageSelected}
									indeterminate={somePageSelected}
									onCheckedChange={(c) => onToggleAll(c === true)}
									aria-label="Select all categories on this page"
								/>
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Name
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Status
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Created
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Last Updated
							</th>
							<th
								scope="col"
								className="w-10 px-3 py-3"
								aria-label="Actions"
							/>
						</tr>
					</thead>
					<tbody className="divide-y divide-base-border">
						{loading ? (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-10 text-center text-sm text-text"
								>
									Memuat categories...
								</td>
							</tr>
						) : paged.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-10 text-center text-sm text-text"
								>
									No categories found.
								</td>
							</tr>
						) : (
							paged.map((row) => {
								const isActiveRow = row.id === selectedId;
								return (
									<tr
										key={row.id}
										onClick={() => onSelect(row.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onSelect(row.id);
											}
										}}
										tabIndex={0}
										className={`cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
											isActiveRow ? "bg-primary-light/50" : "hover:bg-base/60"
										}`}
									>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(row.id)}
												onCheckedChange={(c) => onToggleOne(row.id, c === true)}
												aria-label={`Select ${row.name}`}
											/>
										</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-2.5">
												<span
													className="size-2.5 shrink-0 rounded-full"
													style={{ backgroundColor: dotColor(row.name) }}
													aria-hidden
												/>
												<span
													className={`text-sm font-medium ${
														isActiveRow ? "text-primary" : "text-text-h"
													}`}
												>
													{row.name}
												</span>
											</div>
										</td>
										<td className="px-3 py-3">
											<ActiveBadge isActive={row.isActive} />
										</td>
										<td className="px-3 py-3 text-sm text-text">
											{formatDate(row.createdAt)}
										</td>
										<td className="px-3 py-3 text-sm text-text">
											{formatDate(row.updatedAt)}
										</td>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<ActionMenu
												label={`Actions for ${row.name}`}
												items={[
													{
														label: "View detail",
														onSelect: () => onSelect(row.id),
													},
													{
														label: "Edit",
														onSelect: () => onEdit(row),
													},
													{
														label: "Delete",
														onSelect: () => onDelete(row),
														danger: true,
													},
												]}
											/>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
			<PaginationControls
				totalLabel={totalLabel}
				pageCount={pageCount}
				safePage={safePage}
				onPageChange={onPageChange}
			/>
		</Card>
	);
}
