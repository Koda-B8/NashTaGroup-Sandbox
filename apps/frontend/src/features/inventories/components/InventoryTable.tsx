import PaginationControls from "../../../components/PaginationControls";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import Card from "../../../components/ui/card";
import Checkbox from "../../../components/ui/checkbox";
import { dotColor } from "../../../libs/format";
import type { InventoryItem } from "../api";
import { STOCK_STATUS_TEXT, rowClassName } from "../format";
import StockStatusBadge from "./StockStatusBadge";

interface Props {
	loading: boolean;
	paged: InventoryItem[];
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

const HEAD_CELL = "px-3 py-3 text-xs font-semibold text-text";

export default function InventoryTable({
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
		<Card
			padding="none"
			className="overflow-hidden"
		>
			<div className="overflow-x-auto">
				<table
					className="w-full text-left text-sm"
					aria-label="Inventory"
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
									aria-label="Select all inventory on this page"
								/>
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Product
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Variant
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Brand
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Category
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Stock
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Status
							</th>
							<th
								scope="col"
								className="w-12 px-3 py-3"
								aria-label="Actions"
							/>
						</tr>
					</thead>
					<tbody className="divide-y divide-base-border">
						{loading ? (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-10 text-center text-sm text-text"
								>
									Memuat inventory...
								</td>
							</tr>
						) : paged.length === 0 ? (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-10 text-center text-sm text-text"
								>
									No inventory found.
								</td>
							</tr>
						) : (
							paged.map((row, index) => {
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
										className={`cursor-pointer border-l-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${rowClassName(isActiveRow, index)}`}
									>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(row.id)}
												onCheckedChange={(c) => onToggleOne(row.id, c === true)}
												aria-label={`Select ${row.productName}`}
											/>
										</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-2.5">
												<Avatar
													size="sm"
													shape="square"
													name={row.productName}
												/>
												<div className="min-w-0">
													<span
														className={`block truncate text-sm font-medium ${isActiveRow ? "text-primary" : "text-text-h"}`}
													>
														{row.productName}
													</span>
													<span
														className="block truncate text-2xs text-text"
														title={row.id}
													>
														{row.productCode || row.id}
													</span>
												</div>
											</div>
										</td>
										<td className="px-3 py-3 text-xs text-text">
											{row.variantName || "—"}
										</td>
										<td className="px-3 py-3 text-xs text-text">{row.brand}</td>
										<td className="px-3 py-3">
											<span className="inline-flex items-center gap-1.5 text-xs text-text">
												<span
													className="size-2 shrink-0 rounded-full"
													style={{ backgroundColor: dotColor(row.category) }}
													aria-hidden
												/>
												{row.category}
											</span>
										</td>
										<td className="px-3 py-3">
											<span
												className={`text-sm font-semibold ${STOCK_STATUS_TEXT[row.stockStatus]}`}
											>
												{row.stock}
											</span>
										</td>
										<td className="px-3 py-3">
											<StockStatusBadge status={row.stockStatus} />
										</td>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<ActionMenu
												label={`Actions for ${row.productName}`}
												items={[
													{
														label: "View detail",
														onSelect: () => onSelect(row.id),
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
