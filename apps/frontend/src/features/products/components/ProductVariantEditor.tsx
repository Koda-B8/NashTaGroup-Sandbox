import { Plus, Trash2 } from "lucide-react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import type { ProductItemDraft, ProductItemDraftErrors } from "../format";

interface Props {
	items: ProductItemDraft[];
	errors: Record<string, ProductItemDraftErrors>;
	onChange: (next: ProductItemDraft[]) => void;
	onAdd?: () => void;
	onRemove?: (key: string) => void;
	note?: string;
	emptyHint: string;
}

export default function ProductVariantEditor({
	items,
	errors,
	onChange,
	onAdd,
	onRemove,
	note,
	emptyHint,
}: Props) {
	const patch = (key: string, next: Partial<ProductItemDraft>) =>
		onChange(
			items.map((item) => (item.key === key ? { ...item, ...next } : item)),
		);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-baseline gap-2">
					<p className="text-3xs font-bold tracking-wider text-text uppercase">
						Varian
					</p>
					{note && <span className="text-2xs text-text">{note}</span>}
				</div>
				{onAdd && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onAdd}
					>
						<Plus size={12} />
						Tambah item
					</Button>
				)}
			</div>

			{items.length === 0 ? (
				<p className="rounded-lg border border-dashed border-base-border px-3 py-4 text-center text-xs text-text">
					{emptyHint}
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{items.map((item, index) => {
						const itemError = errors[item.key] ?? {};
						return (
							<li
								key={item.key}
								className="flex flex-col gap-2 rounded-lg border border-base-border bg-base/30 p-2.5"
							>
								<div className="flex items-center justify-between gap-2">
									<div className="flex min-w-0 items-center gap-2">
										{item.hex && (
											<span
												className="size-3.5 shrink-0 rounded-full border border-black/10"
												style={{ backgroundColor: item.hex }}
												aria-hidden
											/>
										)}
										<span className="truncate text-xs font-semibold text-text-h">
											{item.label || `Item ${index + 1}`}
										</span>
									</div>
									{onRemove && (
										<button
											type="button"
											aria-label={`Hapus item ${index + 1}`}
											onClick={() => onRemove(item.key)}
											className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-text hover:bg-danger hover:text-deep-danger"
										>
											<Trash2 size={13} />
										</button>
									)}
								</div>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_0.7fr]">
									<div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
										<label
											htmlFor={`item-code-${item.key}`}
											className="text-2xs font-medium text-text-h"
										>
											Product Code
										</label>
										<Input
											id={`item-code-${item.key}`}
											size="sm"
											placeholder="AERO-BLUE-256"
											value={item.productCode}
											onChange={(e) =>
												patch(item.key, {
													productCode: e.currentTarget.value.toUpperCase(),
												})
											}
											invalid={Boolean(itemError.productCode)}
											autoComplete="off"
										/>
										{itemError.productCode && (
											<span className="text-3xs text-deep-danger">
												{itemError.productCode}
											</span>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<label
											htmlFor={`item-price-${item.key}`}
											className="text-2xs font-medium text-text-h"
										>
											Harga
										</label>
										<Input
											id={`item-price-${item.key}`}
											size="sm"
											inputMode="numeric"
											placeholder="12999000"
											value={item.price}
											onChange={(e) =>
												patch(item.key, {
													price: e.currentTarget.value.replaceAll(
														/[^\d.]/g,
														"",
													),
												})
											}
											invalid={Boolean(itemError.price)}
											autoComplete="off"
										/>
										{itemError.price && (
											<span className="text-3xs text-deep-danger">
												{itemError.price}
											</span>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<label
											htmlFor={`item-stock-${item.key}`}
											className="text-2xs font-medium text-text-h"
										>
											Stock
										</label>
										<Input
											id={`item-stock-${item.key}`}
											size="sm"
											inputMode="numeric"
											placeholder="0"
											value={item.stock}
											onChange={(e) =>
												patch(item.key, {
													stock: e.currentTarget.value.replaceAll(/[^\d]/g, ""),
												})
											}
											invalid={Boolean(itemError.stock)}
											autoComplete="off"
										/>
										{itemError.stock && (
											<span className="text-3xs text-deep-danger">
												{itemError.stock}
											</span>
										)}
									</div>
								</div>
								<label
									htmlFor={`item-active-${item.key}`}
									className="flex items-center gap-2 text-text-h select-none"
								>
									<Checkbox
										id={`item-active-${item.key}`}
										checked={item.isActive}
										onCheckedChange={(checked) =>
											patch(item.key, { isActive: checked === true })
										}
										aria-label={`Item ${index + 1} active`}
									/>
									<span className="text-2xs font-medium">Active</span>
									<span className="text-3xs text-text">— dijual di kasir</span>
								</label>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
