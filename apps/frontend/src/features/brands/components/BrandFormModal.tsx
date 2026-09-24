import { useCallback, useEffect, useState } from "react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import { type Brand, createBrand, updateBrand } from "../api";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	brand: Brand | null;
	onSuccess: () => void;
}

export default function BrandFormModal({
	open,
	onOpenChange,
	brand,
	onSuccess,
}: Props) {
	const isEdit = Boolean(brand);
	const [name, setName] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [nameError, setNameError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) return;
			setName(brand?.name ?? "");
			setIsActive(brand?.isActive ?? true);
			setNameError(null);
			setServerError(null);
		});
	}, [open, brand]);

	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) {
				setNameError(null);
				setServerError(null);
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError(null);
		const trimmed = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmed) {
			setNameError("Nama brand wajib diisi");
			return;
		}
		setNameError(null);
		setSubmitting(true);
		try {
			if (isEdit && brand) {
				const payload: { name?: string; is_active?: boolean } = {};
				if (trimmed !== brand.name) payload.name = trimmed;
				if (isActive !== brand.isActive) payload.is_active = isActive;
				if (Object.keys(payload).length === 0) {
					setServerError("Tidak ada perubahan");
					return;
				}
				await updateBrand(brand.id, payload);
			} else {
				await createBrand({ name: trimmed });
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
			title={isEdit ? "Edit Brand" : "Add Brand"}
			description={
				isEdit && brand ? `Perbarui "${brand.name}"` : "Buat brand baru."
			}
			size="md"
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
					<div className="flex flex-col gap-1">
						<label
							htmlFor="brand-name"
							className="text-xs font-medium text-text-h"
						>
							Name <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="brand-name"
							placeholder="Samsung"
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							invalid={Boolean(nameError)}
							autoComplete="off"
						/>
						{nameError ? (
							<span className="text-xs text-deep-danger">{nameError}</span>
						) : (
							<span className="text-xs text-text">Maks 100 karakter, unik</span>
						)}
					</div>
					{isEdit && (
						<label
							htmlFor="brand-isActive"
							className="flex items-center gap-2 py-1 text-text-h select-none"
						>
							<Checkbox
								id="brand-isActive"
								checked={isActive}
								onCheckedChange={(c) => setIsActive(c === true)}
								aria-label="Active status"
							/>
							<span className="text-xs font-medium">Active</span>
							<span className="text-xs text-text">— is_active</span>
						</label>
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
