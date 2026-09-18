import { useCallback, useEffect, useState } from "react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import { type Category, createCategory, updateCategory } from "../api";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	category: Category | null;
	onSuccess: () => void;
}

export default function CategoryFormModal({
	open,
	onOpenChange,
	category,
	onSuccess,
}: Props) {
	const isEdit = Boolean(category);
	const [name, setName] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) return;
			setName(category?.name ?? "");
			setIsActive(category?.isActive ?? true);
			setError(null);
			setServerError(null);
		});
	}, [open, category]);

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
		const trimmed = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmed) {
			setError("Nama category wajib diisi");
			return;
		}
		if (
			isEdit &&
			category &&
			trimmed === category.name &&
			isActive === category.isActive
		) {
			setServerError("Tidak ada perubahan");
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			if (isEdit && category) {
				const payload: { name?: string; isActive?: boolean } = {};
				if (trimmed !== category.name) payload.name = trimmed;
				if (isActive !== category.isActive) payload.isActive = isActive;
				await updateCategory(category.id, payload);
			} else {
				await createCategory({ name: trimmed });
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
			title={isEdit ? "Edit Category" : "Add Category"}
			description={
				isEdit && category
					? `Perbarui "${category.name}"`
					: "Buat category baru. Nama wajib diisi."
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
					<div className="flex flex-col gap-1">
						<label
							htmlFor="category-name"
							className="text-xs font-medium text-text-h"
						>
							Name <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="category-name"
							placeholder="Gaming Accessories"
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							invalid={Boolean(error)}
							autoComplete="off"
						/>
						{error ? (
							<span className="text-[11px] text-deep-danger">{error}</span>
						) : (
							<span className="text-[11px] text-text">
								Maks 100 karakter, unik
							</span>
						)}
					</div>
					{isEdit && (
						<label
							htmlFor="category-isActive"
							className="flex items-center gap-2 py-1 text-text-h select-none"
						>
							<Checkbox
								id="category-isActive"
								checked={isActive}
								onCheckedChange={(c) => setIsActive(c === true)}
								aria-label="Active status"
							/>
							<span className="text-xs font-medium">Active</span>
							<span className="text-[11px] text-text">— isActive</span>
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
