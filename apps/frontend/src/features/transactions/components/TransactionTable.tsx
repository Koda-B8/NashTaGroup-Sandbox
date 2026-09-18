import PaginationControls from "../../../components/PaginationControls";
import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import Card from "../../../components/ui/card";
import Checkbox from "../../../components/ui/checkbox";
import { formatDate } from "../../../libs/format";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { Transaction } from "../api";
import { paymentStatusVariant, toNumber } from "../format";
import TransactionStatusBadge from "./TransactionStatusBadge";

const COLUMNS = [
	{ key: "transaction", label: "Transaction", className: "w-[22%] px-3" },
	{ key: "customer", label: "Customer", className: "w-[15%] px-3" },
	{ key: "payment", label: "Payment", className: "w-[13%] px-3" },
	{ key: "total", label: "Total", className: "w-[14%] px-3 text-right" },
	{ key: "date", label: "Date", className: "w-[11%] px-3" },
	{ key: "status", label: "Status", className: "w-[14%] px-2" },
];

interface Props {
	loading: boolean;
	paged: Transaction[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onOpenDetail: (transaction: Transaction) => void;
	onCopyNumber: (value: string) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	totalLabel: string;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
}

export default function TransactionTable({
	loading,
	paged,
	selectedId,
	selectedIds,
	allPageSelected,
	somePageSelected,
	onSelect,
	onOpenDetail,
	onCopyNumber,
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
			className="flex min-h-[560px] flex-col overflow-hidden"
		>
			<div className="flex flex-1 flex-col overflow-x-auto">
				<table
					className="w-full min-w-[800px] shrink-0 table-fixed text-left text-sm"
					aria-label="Transactions"
				>
					<thead className="border-b border-base-border bg-base">
						<tr>
							<th
								scope="col"
								className="w-[5%] px-2 py-3"
							>
								<Checkbox
									checked={allPageSelected}
									indeterminate={somePageSelected}
									onCheckedChange={(checked) => onToggleAll(checked === true)}
									aria-label="Select all transactions on this page"
								/>
							</th>
							{COLUMNS.map((column) => (
								<th
									key={column.key}
									scope="col"
									className={`py-3 text-[11px] font-semibold tracking-wide text-text uppercase ${column.className}`}
								>
									{column.label}
								</th>
							))}
							<th
								scope="col"
								className="w-[6%] px-2 py-3"
								aria-label="Actions"
							/>
						</tr>
					</thead>
					<tbody className="divide-y divide-base-border">
						{!loading &&
							paged.map((transaction) => {
								const isActiveRow = transaction.id === selectedId;
								return (
									<tr
										key={transaction.id}
										onClick={() => onSelect(transaction.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												onSelect(transaction.id);
											}
										}}
										tabIndex={0}
										className={`cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
											isActiveRow ? "bg-primary-light/50" : "hover:bg-base/60"
										}`}
									>
										<td
											className="px-2 py-3"
											onClick={(event) => event.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(transaction.id)}
												onCheckedChange={(checked) =>
													onToggleOne(transaction.id, checked === true)
												}
												aria-label={`Select ${transaction.transactionNumber}`}
											/>
										</td>
										<td className="px-3 py-3">
											<p
												className={`truncate text-[13px] font-medium ${
													isActiveRow ? "text-primary" : "text-text-h"
												}`}
												title={transaction.transactionNumber}
											>
												{transaction.transactionNumber}
											</p>
											<p className="truncate text-[11px] text-text">
												{transaction.cashier?.fullname ?? "—"}
											</p>
										</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-2">
												<Avatar
													name={transaction.customer?.name ?? "Non-member"}
													size="sm"
												/>
												<div className="min-w-0">
													<p className="truncate text-[13px] font-medium text-text-h">
														{transaction.customer?.name ?? "Non-member"}
													</p>
													<p className="truncate text-[11px] text-text">
														{transaction.customer?.phone ?? "Guest checkout"}
													</p>
												</div>
											</div>
										</td>
										<td className="px-3 py-3">
											<p className="truncate text-[13px] text-text-h">
												{transaction.payment.method ?? "—"}
											</p>
											{transaction.payment.status && (
												<Badge
													variant={paymentStatusVariant(
														transaction.payment.status,
													)}
													size="sm"
													className="mt-1"
												>
													{transaction.payment.status}
												</Badge>
											)}
										</td>
										<td className="px-3 py-3 text-right text-[13px] font-medium whitespace-nowrap text-text-h">
											{formatRupiah(toNumber(transaction.totalAmount))}
										</td>
										<td className="px-3 py-3 text-[11px] whitespace-nowrap text-text">
											{formatDate(transaction.createdAt)}
										</td>
										<td className="px-2 py-3">
											<TransactionStatusBadge status={transaction.status} />
										</td>
										<td
											className="px-2 py-3"
											onClick={(event) => event.stopPropagation()}
										>
											<ActionMenu
												label={`Actions for ${transaction.transactionNumber}`}
												items={[
													{
														label: "View detail",
														onSelect: () => onOpenDetail(transaction),
													},
													{
														label: "Copy number",
														onSelect: () =>
															onCopyNumber(transaction.transactionNumber),
													},
												]}
											/>
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>
				{loading || paged.length === 0 ? (
					<div className="flex flex-1 items-center justify-center px-4 py-10 text-sm text-text">
						{loading ? "Memuat transaksi..." : "No transactions found."}
					</div>
				) : null}
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
