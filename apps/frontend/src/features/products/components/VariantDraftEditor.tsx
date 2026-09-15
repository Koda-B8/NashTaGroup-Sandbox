import { Plus, Trash2 } from "lucide-react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import type { VariantDraft, VariantDraftErrors } from "../format";

interface Props {
	variants: VariantDraft[];
	errors: Record<string, VariantDraftErrors>;
	onChange: (next: VariantDraft[]) => void;
	onAdd: () => void;
}

export default function VariantDraftEditor({
	variants,
	errors,
	onChange,
	onAdd,
}: Props) {
	const patch = (key: string, next: Partial<VariantDraft>) =>
		onChange(variants.map((v) => (v.key === key ? { ...v, ...next } : v)));

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-[10px] font-semibold tracking-wider text-text uppercase">
						Varian
					</p>
					<p className="text-[11px] text-text">
						Opsional — bisa ditambah sekalian atau nanti.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onAdd}
				>
					<Plus size={12} />
					Tambah varian
				</Button>
			</div>

			{variants.length === 0 ? (
				<p className="rounded-lg border border-dashed border-base-border px-3 py-4 text-center text-xs text-text">
					Belum ada varian.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{variants.map((v, index) => {
						const e = errors[v.key] ?? {};
						return (
							<li
								key={v.key}
								className="flex flex-col gap-2 rounded-lg border border-base-border bg-base/40 p-2.5"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-[10px] font-semibold tracking-wider text-text uppercase">
										Varian {index + 1}
									</span>
									<button
										type="button"
										aria-label={`Hapus varian ${index + 1}`}
										onClick={() =>
											onChange(variants.filter((x) => x.key !== v.key))
										}
										className="inline-flex size-6 items-center justify-center rounded-md text-text hover:bg-danger hover:text-deep-danger"
									>
										<Trash2 size={13} />
									</button>
								</div>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_0.9fr]">
									<div className="flex flex-col gap-1">
										<label
											htmlFor={`variant-code-${v.key}`}
											className="text-[11px] font-medium text-text-h"
										>
											Product Code
										</label>
										<Input
											id={`variant-code-${v.key}`}
											placeholder="SAM-A55-256-BLU"
											value={v.productCode}
											onChange={(ev) =>
												patch(v.key, {
													productCode: ev.currentTarget.value.toUpperCase(),
												})
											}
											invalid={Boolean(e.productCode)}
											autoComplete="off"
										/>
										{e.productCode && (
											<span className="text-[10px] text-deep-danger">
												{e.productCode}
											</span>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<label
											htmlFor={`variant-name-${v.key}`}
											className="text-[11px] font-medium text-text-h"
										>
											Nama varian
										</label>
										<Input
											id={`variant-name-${v.key}`}
											placeholder="Galaxy A55 256GB Blue"
											value={v.name}
											onChange={(ev) =>
												patch(v.key, { name: ev.currentTarget.value })
											}
											invalid={Boolean(e.name)}
											autoComplete="off"
										/>
										{e.name && (
											<span className="text-[10px] text-deep-danger">
												{e.name}
											</span>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<label
											htmlFor={`variant-price-${v.key}`}
											className="text-[11px] font-medium text-text-h"
										>
											Harga
										</label>
										<Input
											id={`variant-price-${v.key}`}
											inputMode="numeric"
											placeholder="6499000"
											value={v.price}
											onChange={(ev) =>
												patch(v.key, {
													price: ev.currentTarget.value.replaceAll(
														/[^\d.]/g,
														"",
													),
												})
											}
											invalid={Boolean(e.price)}
											autoComplete="off"
										/>
										{e.price && (
											<span className="text-[10px] text-deep-danger">
												{e.price}
											</span>
										)}
									</div>
								</div>
								<label
									htmlFor={`variant-active-${v.key}`}
									className="flex items-center gap-2 text-text-h select-none"
								>
									<Checkbox
										id={`variant-active-${v.key}`}
										checked={v.isActive}
										onCheckedChange={(c) =>
											patch(v.key, { isActive: c === true })
										}
										aria-label={`Varian ${index + 1} active`}
									/>
									<span className="text-[11px] font-medium">Active</span>
									<span className="text-[10px] text-text">
										— dijual di kasir
									</span>
								</label>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
