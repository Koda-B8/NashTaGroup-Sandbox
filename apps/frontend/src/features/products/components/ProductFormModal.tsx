import { Image as ImageIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Button from "../../../components/ui/button";
import Checkbox from "../../../components/ui/checkbox";
import ErrorBanner from "../../../components/ui/error-banner";
import Input from "../../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../../components/ui/modal";
import Select from "../../../components/ui/select";
import { formatRupiah } from "../../../libs/formatRupiah";
import { type Brand, listBrands } from "../../brands/api";
import { type Category, listCategories } from "../../categories/api";
import { adjustStock } from "../../inventories/api";
import {
	createProduct,
	createProductItem,
	type Product,
	type ProductItem,
	updateProduct,
	updateProductItem,
	uploadProductImage,
} from "../api";
import {
	type AttributeDefinition,
	type AttributeSelection,
	buildAttributeDefinitions,
	buildCombinations,
	MAX_COMBINATIONS,
	type ProductItemDraft,
	type ProductItemDraftErrors,
	suggestProductCode,
	toNumber,
	validateProductItemDraft,
} from "../format";
import AttributeChips from "./AttributeChips";
import ProductVariantEditor from "./ProductVariantEditor";
import ProductVariantList from "./ProductVariantList";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	product: Product | null;
	onSuccess: (message?: string, variant?: "success" | "error") => void;
	onDeleteVariant?: (item: ProductItem) => void;
	onAdjustStock?: (item: ProductItem) => void;
	onDeleteProduct?: () => void;
}

interface ItemEdit {
	productCode: string;
	price: string;
	stock: string;
	isActive: boolean;
}

const IMAGE_TYPES = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const INITIAL_MANUAL_KEY = "m1";

export default function ProductFormModal({
	open,
	onOpenChange,
	product,
	onSuccess,
	onDeleteVariant,
	onAdjustStock,
	onDeleteProduct,
}: Props) {
	const isEdit = Boolean(product);
	const [categories, setCategories] = useState<Category[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [name, setName] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [brandId, setBrandId] = useState("");
	const [description, setDescription] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [selectedByAttribute, setSelectedByAttribute] = useState<
		Record<string, string[]>
	>({});
	const [specSelection, setSpecSelection] = useState<Record<string, string>>(
		{},
	);
	const [itemEdits, setItemEdits] = useState<Record<string, ItemEdit>>({});
	const [manualKeys, setManualKeys] = useState<string[]>([INITIAL_MANUAL_KEY]);
	const [itemErrors, setItemErrors] = useState<
		Record<string, ProductItemDraftErrors>
	>({});
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [composer, setComposer] = useState<{ itemId: string | null } | null>(
		null,
	);
	const [savingVariant, setSavingVariant] = useState(false);

	const manualSeq = useRef(1);
	const initKeyRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		queueMicrotask(() => {
			if (!open) {
				initKeyRef.current = undefined;
				return;
			}
			const key = product?.id ?? "__create__";
			if (initKeyRef.current === key) return;
			initKeyRef.current = key;
			setName(product?.name ?? "");
			setCategoryId(product?.categoryId ?? "");
			setBrandId(product?.brandId ?? "");
			setDescription(product?.description ?? "");
			setIsActive(product?.isActive ?? true);
			setSelectedByAttribute({});
			setSpecSelection({});
			setItemEdits({});
			setManualKeys([INITIAL_MANUAL_KEY]);
			setItemErrors({});
			setComposer(null);
			setSavingVariant(false);
			setImageFile(null);
			setImageError(null);
			setError(null);
			setServerError(null);
			manualSeq.current = 1;
		});
	}, [open, product]);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		const load = async () => {
			try {
				const [categoryResult, brandResult] = await Promise.all([
					listCategories({ isActive: true, limit: 100 }),
					listBrands({ isActive: true, limit: 100 }),
				]);
				if (cancelled) return;
				setCategories(categoryResult.data);
				setBrands(brandResult.data);
				setCategoryId((current) => current || categoryResult.data[0]?.id || "");
				setBrandId((current) => current || brandResult.data[0]?.id || "");
			} catch {
				if (!cancelled) setServerError("Gagal memuat category/brand");
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [open]);

	const imagePreview = useMemo(
		() => (imageFile ? URL.createObjectURL(imageFile) : null),
		[imageFile],
	);

	useEffect(
		() => () => {
			if (imagePreview) URL.revokeObjectURL(imagePreview);
		},
		[imagePreview],
	);

	const inventoryValue = useMemo(() => {
		let value = 0;
		for (const item of product?.items ?? []) {
			value += toNumber(item.price) * toNumber(item.stock);
		}
		return value;
	}, [product]);

	const category = useMemo(
		() => categories.find((candidate) => candidate.id === categoryId) ?? null,
		[categories, categoryId],
	);
	const definitions = useMemo(
		() => buildAttributeDefinitions(category),
		[category],
	);
	const variantDefinitions = useMemo(
		() => definitions.filter((definition) => definition.isVariant),
		[definitions],
	);
	const specDefinitions = useMemo(
		() => definitions.filter((definition) => !definition.isVariant),
		[definitions],
	);
	const hasVariants = variantDefinitions.length > 0;
	const combinations = useMemo(
		() => buildCombinations(variantDefinitions, selectedByAttribute),
		[variantDefinitions, selectedByAttribute],
	);
	const tooManyCombinations = combinations.length > MAX_COMBINATIONS;
	const specSelections = useMemo<AttributeSelection[]>(
		() =>
			specDefinitions.flatMap((definition) =>
				specSelection[definition.id]
					? [
							{
								attributeId: definition.id,
								optionId: specSelection[definition.id],
							},
						]
					: [],
			),
		[specDefinitions, specSelection],
	);

	const items = useMemo<ProductItemDraft[]>(() => {
		if (hasVariants) {
			if (tooManyCombinations) return [];
			return combinations.map((combination, index) => {
				const edit = itemEdits[combination.key];
				return {
					key: combination.key,
					selections: combination.selections,
					label: combination.label,
					hex: combination.hex,
					productCode:
						edit?.productCode ?? suggestProductCode(combination.label, index),
					price: edit?.price ?? "",
					stock: edit?.stock ?? "0",
					isActive: edit?.isActive ?? true,
				};
			});
		}
		return manualKeys.map((key, index) => {
			const edit = itemEdits[key];
			return {
				key,
				selections: [],
				label: "",
				hex: null,
				productCode: edit?.productCode ?? suggestProductCode("", index),
				price: edit?.price ?? "",
				stock: edit?.stock ?? "0",
				isActive: edit?.isActive ?? true,
			};
		});
	}, [hasVariants, tooManyCombinations, combinations, manualKeys, itemEdits]);

	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) {
				setError(null);
				setServerError(null);
				setItemErrors({});
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	const handleCategoryChange = useCallback((nextId: string) => {
		setCategoryId(nextId);
		setSelectedByAttribute({});
		setSpecSelection({});
		setItemErrors({});
	}, []);

	const handleItemsChange = useCallback((next: ProductItemDraft[]) => {
		const nextEdits: Record<string, ItemEdit> = {};
		for (const item of next) {
			nextEdits[item.key] = {
				productCode: item.productCode,
				price: item.price,
				stock: item.stock,
				isActive: item.isActive,
			};
		}
		setItemEdits(nextEdits);
	}, []);

	const addManualItem = useCallback(() => {
		manualSeq.current += 1;
		setManualKeys((prev) => [...prev, `m${manualSeq.current}`]);
	}, []);

	const removeManualItem = useCallback((key: string) => {
		setManualKeys((prev) => prev.filter((candidate) => candidate !== key));
	}, []);

	const resetComposer = useCallback(() => {
		setSelectedByAttribute({});
		setSpecSelection({});
		setItemEdits({});
		setManualKeys([INITIAL_MANUAL_KEY]);
		setItemErrors({});
		setError(null);
		setServerError(null);
		manualSeq.current = 1;
	}, []);

	const startAddingVariant = useCallback(() => {
		resetComposer();
		setComposer({ itemId: null });
	}, [resetComposer]);

	const startEditingVariant = useCallback(
		(item: ProductItem) => {
			const nextSelected: Record<string, string[]> = {};
			const nextSpec: Record<string, string> = {};
			for (const definition of definitions) {
				const match = (item.attributes ?? []).find(
					(attribute) => attribute.id === definition.id,
				);
				const optionId = match?.optionId ?? "";
				if (!optionId) continue;
				if (definition.isVariant) nextSelected[definition.id] = [optionId];
				else nextSpec[definition.id] = optionId;
			}
			const key =
				buildCombinations(variantDefinitions, nextSelected)[0]?.key ??
				INITIAL_MANUAL_KEY;
			setSelectedByAttribute(nextSelected);
			setSpecSelection(nextSpec);
			setItemEdits({
				[key]: {
					productCode: item.productCode ?? "",
					price: String(toNumber(item.price)),
					stock: String(toNumber(item.stock)),
					isActive: item.isActive ?? true,
				},
			});
			setManualKeys([key]);
			setItemErrors({});
			setError(null);
			setServerError(null);
			manualSeq.current = 1;
			setComposer({ itemId: item.id });
		},
		[definitions, variantDefinitions],
	);

	const cancelComposer = useCallback(() => {
		resetComposer();
		setComposer(null);
	}, [resetComposer]);

	const handleChipChange = useCallback(
		(definition: AttributeDefinition, next: string[]) => {
			const editing = composer?.itemId != null;
			if (definition.isVariant) {
				const value = editing
					? next.length > 0
						? [next.at(-1) ?? ""]
						: []
					: next;
				setSelectedByAttribute((prev) => ({
					...prev,
					[definition.id]: value,
				}));
			} else {
				setSpecSelection((prev) => ({
					...prev,
					[definition.id]: next[0] ?? "",
				}));
			}
		},
		[composer],
	);

	const handleComposerSubmit = async () => {
		if (!product) return;
		const editingId = composer?.itemId ?? null;
		setServerError(null);

		const missingAttributes = definitions.filter((definition) => {
			if (!definition.isRequired) return false;
			if (definition.isVariant)
				return (selectedByAttribute[definition.id]?.length ?? 0) === 0;
			return !specSelection[definition.id];
		});
		if (missingAttributes.length > 0) {
			setError(
				`Atribut wajib belum dipilih: ${missingAttributes
					.map((definition) => definition.name)
					.join(", ")}`,
			);
			return;
		}

		if (items.length === 0) {
			setError(
				tooManyCombinations
					? `Kombinasi melebihi ${MAX_COMBINATIONS}. Kurangi pilihan opsi.`
					: hasVariants
						? "Pilih opsi atribut untuk membuat varian"
						: "Tambahkan minimal 1 item",
			);
			return;
		}

		const targetItem = editingId ? items[0] : undefined;
		if (editingId && !targetItem) {
			setError("Tidak ada varian untuk disimpan");
			return;
		}

		const nextItemErrors: Record<string, ProductItemDraftErrors> = {};
		const codes = new Set(
			(product.items ?? [])
				.filter((candidate) => candidate.id !== editingId)
				.map((candidate) => (candidate.productCode ?? "").trim().toUpperCase())
				.filter(Boolean),
		);
		for (const item of items) {
			const itemError = validateProductItemDraft(item);
			const code = item.productCode.trim().toUpperCase();
			if (!itemError.productCode && codes.has(code))
				itemError.productCode = "Product code duplikat";
			codes.add(code);
			if (Object.keys(itemError).length > 0)
				nextItemErrors[item.key] = itemError;
		}
		setItemErrors(nextItemErrors);
		if (Object.keys(nextItemErrors).length > 0) {
			setError("Periksa kembali varian yang ditandai");
			return;
		}

		setError(null);
		setSavingVariant(true);
		try {
			if (editingId && targetItem) {
				await updateProductItem(editingId, {
					productCode: targetItem.productCode.trim().toUpperCase(),
					name: targetItem.label || product.name,
					price: targetItem.price.trim(),
					isActive: targetItem.isActive,
					attributes: [...targetItem.selections, ...specSelections],
				});
				const nextStock = Number(targetItem.stock.trim());
				const currentStock = toNumber(
					(product.items ?? []).find((candidate) => candidate.id === editingId)
						?.stock ?? 0,
				);
				if (nextStock !== currentStock) {
					await adjustStock(editingId, {
						type: "correction",
						quantity: nextStock,
						note: "Edit varian",
					});
				}
				resetComposer();
				setComposer(null);
				onSuccess("Varian berhasil diperbarui");
			} else {
				for (const item of items) {
					await createProductItem({
						productId: product.id,
						productCode: item.productCode.trim().toUpperCase(),
						name: item.label || product.name,
						price: item.price.trim(),
						stock: Number(item.stock.trim()),
						isActive: item.isActive,
						attributes: [...item.selections, ...specSelections],
					});
				}
				resetComposer();
				setComposer(null);
				onSuccess("Varian berhasil ditambahkan");
			}
		} catch (submitError) {
			setServerError(
				submitError instanceof Error
					? submitError.message
					: "Terjadi kesalahan jaringan",
			);
		} finally {
			setSavingVariant(false);
		}
	};

	const handleImageChange = (file: File | null) => {
		if (!file) {
			setImageFile(null);
			setImageError(null);
			return;
		}
		if (!IMAGE_TYPES.includes(file.type)) {
			setImageError("Format harus AVIF, JPEG, PNG, atau WebP");
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			setImageError("Ukuran gambar maksimal 5 MB");
			return;
		}
		setImageError(null);
		setImageFile(file);
	};

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

		if (isEdit && product) {
			setError(null);
			setSubmitting(true);
			try {
				await updateProduct(
					product.id,
					{
						name: trimmed,
						categoryId,
						brandId,
						description: description.trim(),
						isActive,
					},
					imageFile,
				);
				handleOpen(false);
				onSuccess();
			} catch (submitError) {
				setServerError(
					submitError instanceof Error
						? submitError.message
						: "Terjadi kesalahan jaringan",
				);
			} finally {
				setSubmitting(false);
			}
			return;
		}

		const missingAttributes = definitions.filter((definition) => {
			if (!definition.isRequired) return false;
			if (definition.isVariant)
				return (selectedByAttribute[definition.id]?.length ?? 0) === 0;
			return !specSelection[definition.id];
		});
		if (missingAttributes.length > 0) {
			setError(
				`Atribut wajib belum dipilih: ${missingAttributes
					.map((definition) => definition.name)
					.join(", ")}`,
			);
			return;
		}

		if (items.length === 0) {
			setError(
				tooManyCombinations
					? `Kombinasi melebihi ${MAX_COMBINATIONS}. Kurangi pilihan opsi.`
					: hasVariants
						? "Pilih opsi atribut untuk membuat varian"
						: "Tambahkan minimal 1 item",
			);
			return;
		}

		const nextItemErrors: Record<string, ProductItemDraftErrors> = {};
		const codes = new Set<string>();
		for (const item of items) {
			const itemError = validateProductItemDraft(item);
			const code = item.productCode.trim().toUpperCase();
			if (!itemError.productCode && codes.has(code))
				itemError.productCode = "Product code duplikat";
			codes.add(code);
			if (Object.keys(itemError).length > 0)
				nextItemErrors[item.key] = itemError;
		}
		setItemErrors(nextItemErrors);
		if (Object.keys(nextItemErrors).length > 0) {
			setError("Periksa kembali varian yang ditandai");
			return;
		}

		setError(null);
		setSubmitting(true);
		try {
			const created = await createProduct({
				name: trimmed,
				categoryId,
				brandId,
				description: description.trim(),
				isActive,
				items: items.map((item) => ({
					productCode: item.productCode.trim().toUpperCase(),
					price: item.price.trim(),
					stock: Number(item.stock.trim()),
					isActive: item.isActive,
					attributes: [...item.selections, ...specSelections],
				})),
			});
			const productId = created?.data?.id;
			if (imageFile) {
				if (!productId) {
					handleOpen(false);
					onSuccess(
						"Product dibuat, tapi gambar belum terunggah (id tidak dikembalikan).",
						"error",
					);
					return;
				}
				try {
					await uploadProductImage(productId, imageFile, trimmed);
				} catch (uploadError) {
					handleOpen(false);
					onSuccess(
						`Product dibuat, tapi gambar gagal diunggah: ${
							uploadError instanceof Error ? uploadError.message : "gagal"
						}`,
						"error",
					);
					return;
				}
			}
			handleOpen(false);
			onSuccess();
		} catch (submitError) {
			setServerError(
				submitError instanceof Error
					? submitError.message
					: "Terjadi kesalahan jaringan",
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
					? `Detail & edit "${product.name}".`
					: "Atribut & varian otomatis mengikuti category."
			}
			size="5xl"
		>
			<form
				onSubmit={handleSubmit}
				noValidate
			>
				<ModalBody className="gap-3">
					{serverError && (
						<ErrorBanner
							size="sm"
							message={serverError}
						/>
					)}

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
						<section className="flex flex-col gap-3 rounded-lg border border-base-border p-4">
							<p className="text-3xs font-bold tracking-wider text-text uppercase">
								Details
							</p>
							<div className="flex flex-col gap-1">
								<label
									htmlFor="product-name"
									className="text-xs font-medium text-text-h"
								>
									Name <span className="text-deep-danger">*</span>
								</label>
								<Input
									id="product-name"
									placeholder="AeroBook Pro 14"
									value={name}
									onChange={(e) => setName(e.currentTarget.value)}
									invalid={Boolean(error) && !name.trim()}
									autoComplete="off"
								/>
							</div>
							<div className="grid grid-cols-1 gap-3">
								<div className="flex flex-col gap-1">
									<span className="text-xs font-medium text-text-h">
										Category <span className="text-deep-danger">*</span>
									</span>
									<Select
										label="Product category"
										items={categories.map((candidate) => ({
											label: candidate.name,
											value: candidate.id,
										}))}
										value={categoryId}
										onValueChange={handleCategoryChange}
										placeholder="Pilih category"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-xs font-medium text-text-h">Brand</span>
									<Select
										label="Product brand"
										items={brands.map((brand) => ({
											label: brand.name,
											value: brand.id,
										}))}
										value={brandId}
										onValueChange={setBrandId}
										placeholder="Pilih brand"
									/>
								</div>
							</div>
							<div className="flex flex-col gap-1">
								<label
									htmlFor="product-description"
									className="text-xs font-medium text-text-h"
								>
									Description
								</label>
								<textarea
									id="product-description"
									rows={2}
									placeholder="Deskripsi singkat product"
									value={description}
									onChange={(e) => setDescription(e.currentTarget.value)}
									className="w-full resize-none rounded-lg border border-base-border bg-surface px-3 py-2 text-sm text-text-h placeholder:text-text focus:outline-2 focus:-outline-offset-1 focus:outline-primary"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-text-h">Gambar</span>
								<div className="flex items-center gap-3">
									<label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-base-border px-3 py-2.5 hover:bg-base">
										<input
											type="file"
											accept={IMAGE_TYPES.join(",")}
											className="hidden"
											onChange={(e) =>
												handleImageChange(e.currentTarget.files?.[0] ?? null)
											}
										/>
										{imagePreview ? (
											<img
												src={imagePreview}
												alt=""
												className="size-10 shrink-0 rounded-lg border border-base-border object-cover"
											/>
										) : (
											<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-base text-text">
												<ImageIcon size={16} />
											</span>
										)}
										<span className="flex min-w-0 flex-col">
											<span className="truncate text-xs font-medium text-text-h">
												{imageFile ? imageFile.name : "Pilih gambar"}
											</span>
											<span className="text-2xs text-text">
												AVIF, JPEG, PNG, WebP · maks 5 MB
											</span>
										</span>
									</label>
									{imageFile && (
										<Button
											type="button"
											aria-label="Hapus gambar"
											onClick={() => handleImageChange(null)}
											variant="ghostDanger"
											size="icon"
											className="size-8 shrink-0"
										>
											<X size={15} />
										</Button>
									)}
								</div>
								{imageError && (
									<span className="text-2xs text-deep-danger">
										{imageError}
									</span>
								)}
							</div>
							<label
								htmlFor="product-isActive"
								className="flex items-center gap-2 py-1 text-text-h select-none"
							>
								<Checkbox
									id="product-isActive"
									checked={isActive}
									onCheckedChange={(checked) => setIsActive(checked === true)}
									aria-label="Active status"
								/>
								<span className="text-xs font-medium">Active</span>
								<span className="text-2xs text-text">— tampil di katalog</span>
							</label>
						</section>

						{isEdit ? (
							<section className="flex flex-col gap-3 rounded-lg border border-base-border p-4">
								<ProductVariantList
									items={product?.items ?? []}
									onAdd={composer ? undefined : startAddingVariant}
									onEdit={startEditingVariant}
									onDelete={onDeleteVariant}
									onAdjustStock={onAdjustStock}
								/>

								{composer && (
									<div className="flex flex-col gap-4 border-t border-base-border pt-3">
										<div className="flex items-center justify-between gap-2">
											<p className="text-3xs font-bold tracking-wider text-text uppercase">
												{composer.itemId ? "Edit varian" : "Tambah varian"}
											</p>
											{category && (
												<span className="text-2xs text-text">
													dari category {category.name}
												</span>
											)}
										</div>

										{definitions.length === 0 ? (
											<p className="text-xs text-text">
												Category ini belum punya atribut. Isi item secara
												manual.
											</p>
										) : (
											<div className="flex flex-col gap-3">
												{definitions.map((definition) => {
													const selected = definition.isVariant
														? (selectedByAttribute[definition.id] ?? [])
														: specSelection[definition.id]
															? [specSelection[definition.id]]
															: [];
													return (
														<AttributeChips
															key={definition.id}
															definition={definition}
															selected={selected}
															onChange={(next) =>
																handleChipChange(definition, next)
															}
														/>
													);
												})}
											</div>
										)}

										<ProductVariantEditor
											items={items}
											errors={itemErrors}
											onChange={handleItemsChange}
											onAdd={hasVariants ? undefined : addManualItem}
											onRemove={hasVariants ? undefined : removeManualItem}
											note={
												tooManyCombinations
													? "kombinasi terlalu banyak"
													: hasVariants
														? `${combinations.length} kombinasi otomatis`
														: undefined
											}
											emptyHint={
												tooManyCombinations
													? `Kombinasi melebihi ${MAX_COMBINATIONS}. Kurangi pilihan opsi.`
													: hasVariants
														? "Pilih opsi atribut di atas untuk membuat varian."
														: "Tambahkan minimal 1 item."
											}
										/>

										<div className="flex items-center justify-end gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={cancelComposer}
												disabled={savingVariant}
											>
												Batal
											</Button>
											<Button
												type="button"
												size="sm"
												onClick={handleComposerSubmit}
												disabled={savingVariant}
											>
												{savingVariant
													? "Menyimpan..."
													: composer.itemId
														? "Simpan"
														: "Tambahkan"}
											</Button>
										</div>
									</div>
								)}

								<div className="flex items-center justify-between border-t border-base-border pt-3">
									<span className="text-xs font-bold text-text-h">
										Inventory Value
									</span>
									<span className="text-sm font-bold text-text-h">
										{formatRupiah(inventoryValue)}
									</span>
								</div>
							</section>
						) : (
							<div className="flex flex-col gap-4">
								<section className="flex flex-col gap-3 rounded-lg border border-base-border p-4">
									<div className="flex items-center justify-between gap-2">
										<p className="text-3xs font-bold tracking-wider text-text uppercase">
											Atribut
										</p>
										{category && (
											<span className="text-2xs text-text">
												dari category {category.name}
											</span>
										)}
									</div>
									{definitions.length === 0 ? (
										<p className="text-xs text-text">
											Category ini belum punya atribut. Isi item secara manual
											di bawah.
										</p>
									) : (
										<div className="flex flex-col gap-3">
											{definitions.map((definition) => {
												const selected = definition.isVariant
													? (selectedByAttribute[definition.id] ?? [])
													: specSelection[definition.id]
														? [specSelection[definition.id]]
														: [];
												const invalid =
													Boolean(error) &&
													definition.isRequired &&
													selected.length === 0;
												return (
													<AttributeChips
														key={definition.id}
														definition={definition}
														selected={selected}
														invalid={invalid}
														onChange={(next) =>
															handleChipChange(definition, next)
														}
													/>
												);
											})}
										</div>
									)}
								</section>

								<section className="flex flex-col gap-3 rounded-lg border border-base-border p-4">
									<ProductVariantEditor
										items={items}
										errors={itemErrors}
										onChange={handleItemsChange}
										onAdd={hasVariants ? undefined : addManualItem}
										onRemove={hasVariants ? undefined : removeManualItem}
										note={
											tooManyCombinations
												? "kombinasi terlalu banyak"
												: hasVariants
													? `${combinations.length} kombinasi otomatis`
													: undefined
										}
										emptyHint={
											tooManyCombinations
												? `Kombinasi melebihi ${MAX_COMBINATIONS}. Kurangi pilihan opsi.`
												: hasVariants
													? "Pilih opsi atribut di atas untuk membuat varian."
													: "Tambahkan minimal 1 item."
										}
									/>
								</section>
							</div>
						)}
					</div>

					{error && <span className="text-2xs text-deep-danger">{error}</span>}
				</ModalBody>
				<ModalFooter className={isEdit ? "justify-between" : undefined}>
					{isEdit && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onDeleteProduct}
							disabled={submitting}
						>
							Delete
						</Button>
					)}
					<div className="flex items-center gap-2">
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
					</div>
				</ModalFooter>
			</form>
		</Modal>
	);
}
