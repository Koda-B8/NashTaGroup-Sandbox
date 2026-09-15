import { useCallback, useEffect, useRef, useState } from "react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import Select from "../../../components/ui/select";
import {
	createProduct,
	createProductItem,
	type Product,
	updateProduct,
} from "../api";
import {
	createVariantDraft,
	type VariantDraft,
	type VariantDraftErrors,
	validateVariantDraft,
} from "../format";
import type { SelectOption } from "../hooks/useProductsList";
import VariantDraftEditor from "./VariantDraftEditor";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	product: Product | null;
	categoryOptions: SelectOption[];
	brandOptions: SelectOption[];
	onSuccess: (message?: string, variant?: "success" | "error") => void;
}

export default function ProductFormModal({
	open,
	onOpenChange,
	product,
	categoryOptions,
	brandOptions,
	onSuccess,
}: Props) {
	const isEdit = Boolean(product);
	const [name, setName] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [brandId, setBrandId] = useState("");
	const [description, setDescription] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [variants, setVariants] = useState<VariantDraft[]>([]);
	const [variantErrors, setVariantErrors] = useState<
		Record<string, VariantDraftErrors>
	>({});
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const keySeq = useRef(0);
	const optionsRef = useRef({ categoryOptions, brandOptions });
	useEffect(() => {
		optionsRef.current = { categoryOptions, brandOptions };
	}, [categoryOptions, brandOptions]);

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) return;
			const { categoryOptions: cats, brandOptions: brands } =
				optionsRef.current;
			setName(product?.name ?? "");
			setCategoryId(product?.categoryId ?? cats[0]?.value ?? "");
			setBrandId(product?.brandId ?? brands[0]?.value ?? "");
			setDescription(product?.description ?? "");
			setIsActive(product?.isActive ?? true);
			setVariants([]);
			setVariantErrors({});
			setError(null);
			setServerError(null);
		});
	}, [open, product]);

	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) {
				setError(null);
				setServerError(null);
				setVariantErrors({});
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	const handleAddVariant = useCallback(() => {
		keySeq.current += 1;
		setVariants((prev) => [...prev, createVariantDraft(`v${keySeq.current}`)]);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError(null);
		const trimmed = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmed) {
			setError("Nama product wajib diisi");
			return;
		}
		if (!categoryId) {
			setError("Category wajib dipilih");
			return;
		}
		if (!brandId) {
			setError("Brand wajib dipilih");
			return;
		}

		const nextVariantErrors: Record<string, VariantDraftErrors> = {};
		if (!isEdit) {
			for (const draft of variants) {
				const draftErrors = validateVariantDraft(draft);
				if (Object.keys(draftErrors).length > 0)
					nextVariantErrors[draft.key] = draftErrors;
			}
		}
		setVariantErrors(nextVariantErrors);
		if (Object.keys(nextVariantErrors).length > 0) {
			setError("Periksa kembali varian yang ditandai");
			return;
		}

		setError(null);
		setSubmitting(true);
		try {
			if (isEdit && product) {
				await updateProduct(product.id, {
					name: trimmed,
					categoryId,
					brandId,
					description: description.trim(),
					isActive,
				});
				handleOpen(false);
				onSuccess();
				return;
			}

			const created = await createProduct({
				name: trimmed,
				categoryId,
				brandId,
				description: description.trim(),
				isActive,
			});
			const productId = created?.data?.id;

			if (variants.length > 0 && !productId) {
				handleOpen(false);
				onSuccess(
					"Product dibuat, tapi server tidak mengembalikan id — varian belum tersimpan.",
					"error",
				);
				return;
			}

			const failures: string[] = [];
			for (const draft of variants) {
				try {
					await createProductItem({
						productId: productId as string,
						productCode: draft.productCode.trim().toUpperCase(),
						name: draft.name.trim().replaceAll(/\s+/g, " "),
						price: draft.price.trim(),
						isActive: draft.isActive,
					});
				} catch (variantError) {
					const label =
						draft.productCode.trim() || draft.name.trim() || "varian";
					failures.push(
						`${label} (${variantError instanceof Error ? variantError.message : "gagal"})`,
					);
				}
			}

			handleOpen(false);
			if (failures.length > 0) {
				onSuccess(
					`Product dibuat, tapi ${failures.length} varian gagal: ${failures.join(", ")}`,
					"error",
				);
			} else {
				onSuccess();
			}
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
			title={isEdit ? "Edit Product" : "Add Product"}
			description={
				isEdit && product
					? `Perbarui "${product.name}".`
					: "Buat product baru sekaligus variannya. Category dan brand wajib dipilih."
			}
			size={isEdit ? "lg" : "2xl"}
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
						<div className="flex flex-col gap-1 sm:col-span-2">
							<label
								htmlFor="product-name"
								className="text-xs font-medium text-text-h"
							>
								Name <span className="text-deep-danger">*</span>
							</label>
							<Input
								id="product-name"
								placeholder="Samsung Galaxy A55"
								value={name}
								onChange={(e) => setName(e.currentTarget.value)}
								invalid={Boolean(error) && !name.trim()}
								autoComplete="off"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-text-h">Category</span>
							<Select
								label="Product category"
								items={categoryOptions}
								value={categoryId}
								onValueChange={setCategoryId}
								placeholder="Pilih category"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-text-h">Brand</span>
							<Select
								label="Product brand"
								items={brandOptions}
								value={brandId}
								onValueChange={setBrandId}
								placeholder="Pilih brand"
							/>
						</div>
						<div className="flex flex-col gap-1 sm:col-span-2">
							<label
								htmlFor="product-description"
								className="text-xs font-medium text-text-h"
							>
								Description
							</label>
							<Input
								id="product-description"
								placeholder="Deskripsi singkat product"
								value={description}
								onChange={(e) => setDescription(e.currentTarget.value)}
								autoComplete="off"
							/>
						</div>
					</div>
					<label
						htmlFor="product-isActive"
						className="flex items-center gap-2 py-1 text-text-h select-none"
					>
						<Checkbox
							id="product-isActive"
							checked={isActive}
							onCheckedChange={(c) => setIsActive(c === true)}
							aria-label="Active status"
						/>
						<span className="text-xs font-medium">Active</span>
						<span className="text-[11px] text-text">— tampil di katalog</span>
					</label>

					{!isEdit && (
						<>
							<div className="border-t border-base-border" />
							<VariantDraftEditor
								variants={variants}
								errors={variantErrors}
								onChange={setVariants}
								onAdd={handleAddVariant}
							/>
						</>
					)}

					{error && (
						<span className="text-[11px] text-deep-danger">{error}</span>
					)}
				</ModalBody>
				<ModalFooter className="-mx-5 -mb-4 mt-4">
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
						{submitting ? "Saving..." : (isEdit ? "Save" : "Create")}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}
