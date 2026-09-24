import { Plus } from "lucide-react";

import ActionMenu from "../../../components/ui/action-menu";
import Button from "../../../components/ui/button";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { ProductItem } from "../api";

interface Props {
	items: ProductItem[];
	onAdd?: () => void;
	onEdit?: (item: ProductItem) => void;
	onDelete?: (item: ProductItem) => void;
	onAdjustStock?: (item: ProductItem) => void;
}

const formatPrice = (value: number | string) => {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? formatRupiah(numeric) : "—";
};

export default function ProductVariantList({
	items,
	onAdd,
	onEdit,
	onDelete,
	onAdjustStock,
}: Props) {
	const hasActions = Boolean(onEdit || onDelete || onAdjustStock);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-baseline gap-2">
					<p className="text-2xs font-bold tracking-wider text-text uppercase">
						Varian
					</p>
					<span className="text-xs text-text">{items.length} varian</span>
				</div>
				{onAdd && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onAdd}
					>
						<Plus size={12} />
						Tambah varian
					</Button>
				)}
			</div>

			{items.length === 0 ? (
				<p className="rounded-lg border border-dashed border-base-border px-3 py-4 text-center text-xs text-text">
					Belum ada varian.
				</p>
			) : (
				<ul className="flex flex-col divide-y divide-base-border rounded-lg border border-base-border">
					{items.map((item) => {
						const attributes = item.attributes ?? [];
						const content = (
							<>
								{attributes.length > 0 ? (
									<div className="flex flex-wrap items-center gap-1.5">
										{attributes.map((attribute) => (
											<span
												key={
													attribute.optionId ?? attribute.id ?? attribute.name
												}
												className="inline-flex items-center rounded-md border border-base-border bg-base px-1.5 py-0.5 text-xs font-medium text-text-h"
											>
												{attribute.value ?? attribute.name ?? "—"}
											</span>
										))}
									</div>
								) : (
									<span className="truncate text-xs font-medium text-text-h">
										{item.name}
									</span>
								)}
								<span className="truncate font-mono text-xs text-text">
									{item.productCode ?? "—"} · {formatPrice(item.price)} · stok{" "}
									{item.stock}
								</span>
							</>
						);
						return (
							<li
								key={item.id}
								className={
									onEdit
										? "flex items-start justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-base"
										: "flex items-start justify-between gap-3 px-3 py-2.5"
								}
							>
								{onEdit ? (
									<button
										type="button"
										onClick={() => onEdit(item)}
										className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
									>
										{content}
									</button>
								) : (
									<div className="flex min-w-0 flex-col gap-1">{content}</div>
								)}
								<div className="flex shrink-0 items-center gap-1">
									<span
										className={
											item.isActive === false
												? "rounded-md bg-base px-1.5 py-0.5 text-2xs font-semibold text-text"
												: "rounded-md bg-primary-light px-1.5 py-0.5 text-2xs font-semibold text-primary"
										}
									>
										{item.isActive === false ? "Nonaktif" : "Aktif"}
									</span>
									{hasActions && (
										<ActionMenu
											label={`Aksi untuk ${item.name}`}
											items={[
												...(onAdjustStock
													? [
															{
																label: "Adjust Stock",
																onSelect: () => onAdjustStock(item),
															},
														]
													: []),
												...(onEdit
													? [{ label: "Edit", onSelect: () => onEdit(item) }]
													: []),
												...(onDelete
													? [
															{
																label: "Delete",
																onSelect: () => onDelete(item),
																danger: true,
															},
														]
													: []),
											]}
										/>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
