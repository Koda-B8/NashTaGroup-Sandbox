import { useCallback, useEffect, useState } from "react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import {
	type Category,
	type CategoryAttributeInput,
	createCategory,
	updateCategory,
} from "../api";
import CategoryAttributeEditor, {
	type AttributeDraft,
	HEX_PATTERN,
	newDraftKey,
} from "./CategoryAttributeEditor";

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
	const attributesLoaded = !isEdit || Array.isArray(category?.attributes);
	const [name, setName] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [attributes, setAttributes] = useState<AttributeDraft[]>([]);
	const [nameError, setNameError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) return;
			setName(category?.name ?? "");
			setIsActive(category?.isActive ?? true);
			setAttributes(
				(category?.attributes ?? []).map((attribute) => ({
					key: newDraftKey(),
					id: attribute.id,
					name: attribute.name ?? "",
					value: attribute.value ?? "",
					isRequired: attribute.isRequired ?? false,
					isVariant: attribute.isVariant ?? true,
					options: (attribute.options ?? []).map((option) => ({
						key: newDraftKey(),
						id: option.id,
						name: option.name ?? "",
						hex: option.hex ?? "",
					})),
				})),
			);
			setNameError(null);
			setFormError(null);
			setServerError(null);
		});
	}, [open, category]);

	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) {
				setNameError(null);
				setFormError(null);
				setServerError(null);
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	const buildAttributes = (): CategoryAttributeInput[] =>
		attributes.map((attribute) => {
			const payload: CategoryAttributeInput = {
				...(attribute.id ? { id: attribute.id } : {}),
				name: attribute.name.trim().replaceAll(/\s+/g, " "),
				value: attribute.value.trim() || null,
				isRequired: attribute.isRequired,
				isVariant: attribute.isVariant,
			};
			if (attribute.isVariant) {
				payload.options = attribute.options.map((option) => ({
					...(option.id ? { id: option.id } : {}),
					name: option.name.trim().replaceAll(/\s+/g, " "),
					hex: option.hex.trim() ? option.hex.trim().toUpperCase() : null,
				}));
			}
			return payload;
		});

	const validateAttributes = (): string | null => {
		for (const [index, attribute] of attributes.entries()) {
			if (!attribute.name.trim())
				return `Nama atribut ${index + 1} wajib diisi`;
			if (!attribute.isVariant) continue;
			for (const [optionIndex, option] of attribute.options.entries()) {
				if (!option.name.trim())
					return `Nama opsi ${optionIndex + 1} pada atribut ${index + 1} wajib diisi`;
				if (option.hex.trim() && !HEX_PATTERN.test(option.hex.trim()))
					return `Warna opsi ${optionIndex + 1} pada atribut ${index + 1} harus format #RRGGBB`;
			}
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError(null);
		const trimmed = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmed) {
			setNameError("Nama category wajib diisi");
			setFormError(null);
			return;
		}
		setNameError(null);
		const attributeError = validateAttributes();
		if (attributeError) {
			setFormError(attributeError);
			return;
		}
		setFormError(null);
		setSubmitting(true);
		try {
			if (isEdit && category) {
				const payload: {
					name?: string;
					isActive?: boolean;
					attributes?: CategoryAttributeInput[];
				} = {};
				if (trimmed !== category.name) payload.name = trimmed;
				if (isActive !== category.isActive) payload.isActive = isActive;
				if (attributesLoaded) payload.attributes = buildAttributes();
				if (Object.keys(payload).length === 0) {
					setServerError("Tidak ada perubahan");
					return;
				}
				await updateCategory(category.id, payload);
			} else {
				const payload: {
					name: string;
					attributes?: CategoryAttributeInput[];
				} = { name: trimmed };
				if (attributes.length > 0) payload.attributes = buildAttributes();
				await createCategory(payload);
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
					: "Buat category baru beserta atributnya."
			}
			size="xl"
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
							invalid={Boolean(nameError)}
							autoComplete="off"
						/>
						{nameError ? (
							<span className="text-2xs text-deep-danger">{nameError}</span>
						) : (
							<span className="text-2xs text-text">
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
							<span className="text-2xs text-text">— isActive</span>
						</label>
					)}

					<CategoryAttributeEditor
						attributes={attributes}
						onChange={setAttributes}
						invalid={Boolean(formError)}
					/>
					{formError && (
						<span
							className="text-2xs text-deep-danger"
							role="alert"
						>
							{formError}
						</span>
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
