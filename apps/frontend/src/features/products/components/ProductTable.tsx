import PaginationControls from "../../../components/PaginationControls";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import Card from "../../../components/ui/card";
import Checkbox from "../../../components/ui/checkbox";
import { dotColor } from "../../../libs/format";
import type { Product } from "../api";
import { priceLabel, rowClassName, stockTone, toNumber } from "../format";
import StatusBadge from "./StatusBadge";

function VariantPill({ count }: { count: number }) {
	return (
		<span className="inline-flex h-5 min-w-11 items-center justify-center rounded-full border border-base-border bg-base px-2 text-xs font-medium text-text">
			{count} varian
		</span>
	);
}

interface Props {
	loading: boolean;
	paged: Product[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onOpenDetail: (product: Product) => void;
	onEdit: (product: Product) => void;
	onDelete: (product: Product) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	totalLabel: string;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
}

export default function ProductTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onOpenDetail,
	onEdit,
	onDelete,
	onToggleAll,
	onToggleOne,
	totalLabel,
	pageCount,
	safePage,
	onPageChange,
}: Props) {
	return (
		<Card
			padding="none"
			className="overflow-hidden"
		>
			<div className="overflow-x-auto">
				<table
					className="w-full text-left text-sm"
					aria-label="Products"
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
									aria-label="Select all products on this page"
								/>
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase"
							>
								Product
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase"
							>
								Category
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase"
							>
								Brand
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase"
							>
								Variant
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase"
							>
								Stock
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-right text-xs font-semibold tracking-wide text-text uppercase"
							>
								Price
							</th>
							<th
								scope="col"
								className="px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase"
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
									colSpan={9}
									className="px-4 py-10 text-center text-sm text-text"
								>
									Memuat products...
								</td>
							</tr>
						) : paged.length === 0 ? (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-10 text-center text-sm text-text"
								>
									No products found.
								</td>
							</tr>
						) : (
							paged.map((row, index) => {
								const isActiveRow = row.id === selectedId;
								const stock = toNumber(row.stock);
								const tone = stockTone(stock);
								return (
									<tr
										key={row.id}
										onClick={() => onOpenDetail(row)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onOpenDetail(row);
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
												aria-label={`Select ${row.name}`}
											/>
										</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-2.5">
												<Avatar
													size="sm"
													shape="square"
													src={row.image?.url ?? undefined}
													alt={row.image?.alt ?? row.name}
													name={row.name}
												/>
												<div className="min-w-0">
													<span
														className={`block truncate text-sm font-medium ${isActiveRow ? "text-primary" : "text-text-h"}`}
													>
														{row.name}
													</span>
													<span
														className="block truncate text-xs text-text"
														title={row.id}
													>
														{row.description ?? row.id}
													</span>
												</div>
											</div>
										</td>
										<td className="px-3 py-3">
											<span className="inline-flex items-center gap-1.5 text-xs text-text">
												<span
													className="size-2 shrink-0 rounded-full"
													style={{
														backgroundColor: dotColor(
															row.category?.name ?? "—",
														),
													}}
													aria-hidden
												/>
												{row.category?.name ?? "—"}
											</span>
										</td>
										<td className="px-3 py-3 text-xs text-text">
											{row.brand?.name ?? "—"}
										</td>
										<td className="px-3 py-3">
											<VariantPill count={(row.items ?? []).length} />
										</td>
										<td className="px-3 py-3">
											<span
												className={`text-sm font-semibold ${tone.className}`}
											>
												{stock}
											</span>
										</td>
										<td className="px-3 py-3 text-right text-sm font-semibold text-text-h">
											{priceLabel(row.items ?? [])}
										</td>
										<td className="px-3 py-3">
											<StatusBadge isActive={row.isActive} />
										</td>
										<td
											className="px-3 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<ActionMenu
												label={`Actions for ${row.name}`}
												items={[
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
