import { useCallback, useEffect, useState } from "react";

import Button from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import Select from "../../../components/ui/select";
import { type AdjustmentType, adjustStock, type StockAdjustment } from "../api";

const TYPE_OPTIONS: { label: string; value: AdjustmentType }[] = [
	{ label: "Addition — tambah stok", value: "addition" },
	{ label: "Reduction — kurangi stok", value: "reduction" },
	{ label: "Correction — set stok akhir", value: "correction" },
];

const TYPE_HINT: Record<AdjustmentType, string> = {
	addition: "Stok akhir = stok sekarang + jumlah",
	reduction: "Stok akhir = stok sekarang − jumlah",
	correction: "Stok akhir = jumlah (hasil hitung fisik)",
};

export interface AdjustStockTarget {
	id: string;
	label: string;
	stock: number;
}

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	target: AdjustStockTarget | null;
	onSuccess?: (adjustment: StockAdjustment) => void;
}

export default function AdjustStockModal({
	open,
	onOpenChange,
	target,
	onSuccess,
}: Props) {
	const [type, setType] = useState<AdjustmentType>("addition");
	const [quantity, setQuantity] = useState("");
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const currentStock = target?.stock ?? 0;
	const parsedQuantity = Number.parseInt(quantity, 10);
	const hasQuantity = Number.isInteger(parsedQuantity) && parsedQuantity >= 1;
	const previewStock = hasQuantity
		? type === "addition"
			? currentStock + parsedQuantity
			: type === "reduction"
				? currentStock - parsedQuantity
				: parsedQuantity
		: currentStock;

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) return;
			setType("addition");
			setQuantity("");
			setNote("");
			setError(null);
			setServerError(null);
		});
	}, [open, target]);

	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) {
				setError(null);
				setServerError(null);
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError(null);
		if (!target) {
			setServerError("Pilih varian terlebih dahulu");
			return;
		}
		if (!hasQuantity) {
			setError("Jumlah harus bilangan bulat minimal 1");
			return;
		}
		if (type === "reduction" && parsedQuantity > currentStock) {
			setError(`Jumlah melebihi stok tersedia (${currentStock})`);
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			const trimmedNote = note.trim();
			const adjustment = await adjustStock(target.id, {
				type,
				quantity: parsedQuantity,
				...(trimmedNote ? { note: trimmedNote } : {}),
			});
			handleOpen(false);
			onSuccess?.(adjustment);
		} catch (error) {
			setServerError(
				error instanceof Error ? error.message : "Terjadi kesalahan jaringan",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			open={open}
			onOpenChange={handleOpen}
			title="Adjust Stock"
			description={target?.label}
			size="lg"
		>
			<form
				onSubmit={handleSubmit}
				noValidate
			>
				<ModalBody>
					{serverError && (
						<div
							className="rounded-lg border border-danger bg-danger px-3 py-2 text-xs text-deep-danger"
							role="alert"
						>
							{serverError}
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-text-h">
								Type <span className="text-deep-danger">*</span>
							</span>
							<Select
								label="Adjustment type"
								items={TYPE_OPTIONS}
								value={type}
								onValueChange={(value) => setType(value as AdjustmentType)}
								className="w-full min-w-0"
							/>
							<span className="text-xs text-text">{TYPE_HINT[type]}</span>
						</div>
						<div className="flex flex-col gap-1">
							<label
								htmlFor="adjust-quantity"
								className="text-xs font-medium text-text-h"
							>
								Quantity <span className="text-deep-danger">*</span>
							</label>
							<Input
								id="adjust-quantity"
								inputMode="numeric"
								placeholder="10"
								value={quantity}
								onChange={(e) =>
									setQuantity(e.currentTarget.value.replaceAll(/[^\d]/g, ""))
								}
								invalid={Boolean(error) && !hasQuantity}
								autoComplete="off"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label
							htmlFor="adjust-note"
							className="text-xs font-medium text-text-h"
						>
							Note
						</label>
						<Input
							id="adjust-note"
							placeholder="Restock from supplier"
							value={note}
							onChange={(e) => setNote(e.currentTarget.value)}
							autoComplete="off"
						/>
					</div>

					{error && <span className="text-xs text-deep-danger">{error}</span>}

					<div className="flex items-center justify-between rounded-lg border border-base-border bg-base px-3 py-2.5">
						<div className="flex flex-col">
							<span className="text-xs text-text">Current stock</span>
							<span className="text-sm font-semibold text-text-h">
								{currentStock}
							</span>
						</div>
						<span
							className="text-text"
							aria-hidden
						>
							→
						</span>
						<div className="flex flex-col items-end">
							<span className="text-xs text-text">After</span>
							<span
								className={`text-sm font-bold ${
									previewStock < 0 ? "text-deep-danger" : "text-text-h"
								}`}
							>
								{previewStock}
							</span>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => handleOpen(false)}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						size="sm"
						disabled={submitting}
					>
						{submitting ? "Saving..." : "Adjust"}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}
