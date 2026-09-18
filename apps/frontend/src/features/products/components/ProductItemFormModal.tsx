import { useCallback, useEffect, useState } from "react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import {
	createProductItem,
	type Product,
	type ProductItem,
	updateProductItem,
} from "../api";
import { toNumber } from "../format";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	product: Product | null;
	item: ProductItem | null;
	onSuccess: () => void;
}

export default function ProductItemFormModal({
	open,
	onOpenChange,
	product,
	item,
	onSuccess,
}: Props) {
	const isEdit = Boolean(item);
	const [productCode, setProductCode] = useState("");
	const [name, setName] = useState("");
	const [price, setPrice] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) return;
			setProductCode(item?.productCode ?? "");
			setName(item?.name ?? "");
			setPrice(item ? String(toNumber(item.price)) : "");
			setIsActive(item?.isActive ?? true);
			setError(null);
			setServerError(null);
		});
	}, [open, item]);

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
		if (!product) {
			setServerError("Pilih product terlebih dahulu");
			return;
		}
		const code = productCode.trim().toUpperCase();
		if (!/^[A-Z0-9][A-Z0-9-]{0,49}$/.test(code)) {
			setError("Product code hanya huruf besar, angka, dan tanda hubung (-)");
			return;
		}
		const trimmedName = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmedName) {
			setError("Nama varian wajib diisi");
			return;
		}
		const priceValue = price.trim();
		if (!/^\d{1,13}(\.\d{1,2})?$/.test(priceValue) || Number(priceValue) <= 0) {
			setError("Harga harus angka > 0 dengan maksimal 2 desimal");
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			if (isEdit && item) {
				await updateProductItem(item.id, {
					productCode: code,
					name: trimmedName,
					price: priceValue,
					isActive,
				});
			} else {
				await createProductItem({
					productId: product.id,
					productCode: code,
					name: trimmedName,
					price: priceValue,
					isActive,
				});
			}
			handleOpen(false);
			onSuccess();
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
			title={isEdit ? "Edit Varian" : "Add Product Item"}
			description={
				product ? `Product: ${product.name}` : "Pilih product terlebih dahulu"
			}
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
							<label
								htmlFor="item-code"
								className="text-xs font-medium text-text-h"
							>
								Product Code <span className="text-deep-danger">*</span>
							</label>
							<Input
								id="item-code"
								placeholder="SAM-A55-256-BLU"
								value={productCode}
								onChange={(e) =>
									setProductCode(e.currentTarget.value.toUpperCase())
								}
								invalid={Boolean(error) && !productCode.trim()}
								autoComplete="off"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label
								htmlFor="item-price"
								className="text-xs font-medium text-text-h"
							>
								Price <span className="text-deep-danger">*</span>
							</label>
							<Input
								id="item-price"
								inputMode="numeric"
								placeholder="6499000"
								value={price}
								onChange={(e) =>
									setPrice(e.currentTarget.value.replaceAll(/[^\d.]/g, ""))
								}
								invalid={
									Boolean(error) && !/^\d{1,13}(\.\d{1,2})?$/.test(price.trim())
								}
								autoComplete="off"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<label
							htmlFor="item-name"
							className="text-xs font-medium text-text-h"
						>
							Variant Name <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="item-name"
							placeholder="Samsung Galaxy A55 256GB Blue"
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							invalid={Boolean(error) && !name.trim()}
							autoComplete="off"
						/>
					</div>
					<label
						htmlFor="item-isActive"
						className="flex items-center gap-2 py-1 text-text-h select-none"
					>
						<Checkbox
							id="item-isActive"
							checked={isActive}
							onCheckedChange={(c) => setIsActive(c === true)}
							aria-label="Variant active status"
						/>
						<span className="text-xs font-medium">Active</span>
						<span className="text-[11px] text-text">— dijual di kasir</span>
					</label>
					{error && (
						<span className="text-[11px] text-deep-danger">{error}</span>
					)}
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
						{submitting ? "Saving..." : isEdit ? "Save" : "Create"}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}
