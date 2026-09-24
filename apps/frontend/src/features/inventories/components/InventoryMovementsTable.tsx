import PaginationControls from "../../../components/PaginationControls";
import Avatar from "../../../components/ui/avatar";
import Card from "../../../components/ui/card";
import Checkbox from "../../../components/ui/checkbox";
import type { InventoryMovement } from "../api";
import {
	formatDateTime,
	formatMovementQuantity,
	MOVEMENT_TYPE_TEXT,
} from "../format";
import MovementSourceBadge from "./MovementSourceBadge";
import MovementTypeBadge from "./MovementTypeBadge";

interface Props {
	loading: boolean;
	paged: InventoryMovement[];
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

const HEAD_CELL =
	"px-3 py-3 text-xs font-semibold tracking-wide text-text uppercase whitespace-nowrap";

export default function InventoryMovementsTable({
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
					className="w-full min-w-[880px] text-left text-sm"
					aria-label="Inventory movements"
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
									onCheckedChange={(checked) => onToggleAll(checked === true)}
									aria-label="Select all movements on this page"
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
								Type
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Qty
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
								Source
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Transaction
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								By
							</th>
							<th
								scope="col"
								className={HEAD_CELL}
							>
								Date
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-base-border">
						{loading ? (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-10 text-center text-sm text-text"
								>
									Memuat riwayat inventory...
								</td>
							</tr>
						) : paged.length === 0 ? (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-10 text-center text-sm text-text"
								>
									No inventory movements found.
								</td>
							</tr>
						) : (
							paged.map((movement, index) => {
								const isActiveRow = movement.id === selectedId;
								return (
									<tr
										key={movement.id}
										onClick={() => onSelect(movement.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												onSelect(movement.id);
											}
										}}
										tabIndex={0}
										className={`cursor-pointer border-l-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
											isActiveRow
												? "border-l-primary bg-primary-light/50"
												: index % 2 === 1
													? "border-l-transparent bg-base/40 hover:bg-base/70"
													: "border-l-transparent hover:bg-base/60"
										}`}
									>
										<td
											className="px-3 py-3"
											onClick={(event) => event.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(movement.id)}
												onCheckedChange={(checked) =>
													onToggleOne(movement.id, checked === true)
												}
												aria-label={`Select movement for ${movement.productItem.productName}`}
											/>
										</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-2.5">
												<Avatar
													size="sm"
													shape="square"
													name={movement.productItem.productName}
												/>
												<div className="min-w-0">
													<span
														className={`block truncate text-sm font-medium ${
															isActiveRow ? "text-primary" : "text-text-h"
														}`}
													>
														{movement.productItem.productName}
													</span>
													<span
														className="block truncate text-xs text-text"
														title={movement.productItem.id}
													>
														{movement.productItem.productCode ||
															movement.productItem.variantName ||
															"—"}
													</span>
												</div>
											</div>
										</td>
										<td className="px-3 py-3">
											<MovementTypeBadge type={movement.type} />
										</td>
										<td className="px-3 py-3">
											<span
												className={`text-sm font-semibold ${MOVEMENT_TYPE_TEXT[movement.type]}`}
											>
												{formatMovementQuantity(
													movement.type,
													movement.quantity,
												)}
											</span>
										</td>
										<td className="px-3 py-3 text-xs whitespace-nowrap text-text">
											<span className="font-medium text-text-h">
												{movement.stockBefore}
											</span>
											<span
												className="mx-1 text-text"
												aria-hidden
											>
												→
											</span>
											<span className="font-medium text-text-h">
												{movement.stockAfter}
											</span>
										</td>
										<td className="px-3 py-3">
											<MovementSourceBadge source={movement.source} />
										</td>
										<td className="px-3 py-3 text-xs whitespace-nowrap">
											{movement.transaction ? (
												<span
													className="font-medium text-text-h"
													title={movement.transaction.transactionNumber}
												>
													{movement.transaction.transactionNumber}
												</span>
											) : (
												<span className="text-text">—</span>
											)}
										</td>
										<td className="px-3 py-3 text-xs whitespace-nowrap text-text">
											{movement.performedBy?.fullname ?? "—"}
										</td>
										<td className="px-3 py-3 text-xs whitespace-nowrap text-text">
											{formatDateTime(movement.createdAt)}
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
