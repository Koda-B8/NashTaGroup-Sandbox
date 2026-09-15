import { Plus } from "lucide-react";
import { useMemo } from "react";

import ActionMenu from "../../../components/ui/action-menu";
import Avatar from "../../../components/ui/avatar";
import Badge from "../../../components/ui/badge";
import Button from "../../../components/ui/button";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import { formatDate } from "../../../libs/format";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { Product, ProductItem } from "../api";
import { stockBadgeVariant, stockTone, toNumber } from "../format";
import StatusBadge from "./StatusBadge";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	product: Product | null;
	onDelete: () => void;
	onEdit: () => void;
	onAddVariant: () => void;
	onEditVariant: (item: ProductItem) => void;
	onDeleteVariant: (item: ProductItem) => void;
}

export default function ProductDetailModal({
	open,
	onOpenChange,
	product,
	onDelete,
	onEdit,
	onAddVariant,
	onEditVariant,
	onDeleteVariant,
}: Props) {
	const inventoryValue = useMemo(() => {
		if (!product) return 0;
		let value = 0;
		for (const item of product.items ?? []) {
			value += toNumber(item.price) * toNumber(item.stock);
		}
		return value;
	}, [product]);

	const stock = product ? toNumber(product.stock) : 0;

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Product Detail"
			size="lg"
		>
			{product ? (
				<ModalBody>
					<div className="flex flex-col gap-2">
						<div className="flex items-start gap-3">
							<Avatar
								size="md"
								shape="square"
								src={product.image?.url ?? undefined}
								alt={product.image?.alt ?? product.name}
								name={product.name}
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-bold text-text-h">
									{product.name}
								</p>
								<p
									className="truncate text-[11px] text-text"
									title={product.id}
								>
									{product.id}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<StatusBadge isActive={product.isActive} />
							<Badge
								variant={stockBadgeVariant(stock)}
								size="sm"
							>
								{stockTone(stock).label}
							</Badge>
						</div>
					</div>

					<div className="border-t border-base-border" />

					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
							<p className="truncate text-xs font-semibold text-text-h">
								{product.category?.name ?? "—"}
							</p>
							<p className="text-[11px] text-text">Category</p>
						</div>
						<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
							<p className="truncate text-xs font-semibold text-text-h">
								{product.brand?.name ?? "—"}
							</p>
							<p className="text-[11px] text-text">Brand</p>
						</div>
						<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
							<p className="text-xs font-semibold text-text-h">{stock} units</p>
							<p className="text-[11px] text-text">Total Stock</p>
						</div>
						<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
							<p className="text-xs font-semibold text-text-h">
								{formatDate(product.updatedAt)}
							</p>
							<p className="text-[11px] text-text">Last Updated</p>
						</div>
					</div>

					<div className="border-t border-base-border" />

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<p className="text-[10px] font-semibold tracking-wider text-text uppercase">
								Variants
							</p>
							<button
								type="button"
								onClick={onAddVariant}
								className="inline-flex items-center gap-1 rounded-lg border border-base-border px-2 py-1 text-[11px] font-medium text-text-h hover:bg-base"
							>
								<Plus size={12} />
								Add
							</button>
						</div>
						{(product.items ?? []).length === 0 ? (
							<p className="text-xs text-text">Belum ada varian.</p>
						) : (
							<ul className="flex flex-col gap-2">
								{(product.items ?? []).map((item) => (
									<li
										key={item.id}
										className="flex items-start justify-between gap-2"
									>
										<div className="flex min-w-0 flex-1 items-start gap-2">
											<span
												className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/45"
												aria-hidden
											/>
											<div className="min-w-0">
												<p className="truncate text-xs font-medium text-text-h">
													{item.name}
												</p>
												<p
													className="truncate text-[11px] text-text"
													title={item.productCode}
												>
													{item.productCode ?? "—"} · {toNumber(item.stock)} in
													stock
												</p>
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											<span className="text-xs font-semibold text-text-h">
												{formatRupiah(toNumber(item.price))}
											</span>
											<ActionMenu
												label={`Actions for ${item.name}`}
												items={[
													{
														label: "Edit",
														onSelect: () => onEditVariant(item),
													},
													{
														label: "Delete",
														onSelect: () => onDeleteVariant(item),
														danger: true,
													},
												]}
											/>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="border-t border-base-border" />

					<div className="flex items-center justify-between rounded-lg bg-base px-3 py-2.5">
						<span className="text-xs font-bold text-text-h">
							Inventory Value
						</span>
						<span className="text-sm font-bold text-text-h">
							{formatRupiah(inventoryValue)}
						</span>
					</div>
				</ModalBody>
			) : null}
			<ModalFooter className="-mx-5 -mb-4 mt-4 justify-between">
				<Button
					variant="outline"
					size="sm"
					disabled={!product}
					onClick={onDelete}
				>
					Delete
				</Button>
				<Button
					size="sm"
					disabled={!product}
					onClick={onEdit}
				>
					Edit Product
				</Button>
			</ModalFooter>
		</Modal>
	);
}
