import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router";

import CardSkel from "../components/CardSkel";
import PaginationControls from "../components/PaginationControls";
import ProductCard, { ProductGrid } from "../components/ProductCard";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Modal from "../components/ui/modal";
import Select from "../components/ui/select";
import Toast from "../components/ui/toast";
import { useFlash } from "../hooks/useFlash";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch } from "../store";
import { addToCart, type CartItem } from "../store/slices/cart";

interface CategoryOption {
	id: string;
	name: string;
	hex?: string;
	sortOrder?: number;
}

interface CategoryAttribute {
	id: string;
	name: string;
	value?: string;
	isRequired: boolean;
	isVariant: boolean;
	sortOrder: number;
	options: CategoryOption[];
}

interface Category {
	id: string;
	name: string;
	isActive: boolean;
	attributes?: CategoryAttribute[];
}

interface Brand {
	id: string;
	name: string;
	isActive: boolean;
}

interface VariantAttribute {
	id: string;
	name: string;
	value: string;
	optionId: string;
	isRequired: boolean;
	isVariant: boolean;
	sortOrder: number;
}

interface ProductItem {
	id: string;
	productCode: string;
	name: string;
	price: string;
	isActive: boolean;
	attributes?: VariantAttribute[];
	image: { alt: string; url: string | null };
	stock: number;
}

interface Product {
	id: string;
	categoryId: string;
	brandId: string;
	name: string;
	description: string;
	isActive: boolean;
	category: Category;
	brand: Brand;
	items: ProductItem[];
	image: { alt: string; url: string | null };
	stock: number;
}

interface Pagination {
	page: number;
	limit: number;
	total_items: number;
	total_pages: number;
}

interface VariantOption {
	key: string;
	value: string;
	hex?: string;
}

interface VariantGroup {
	id: string;
	name: string;
	sortOrder: number;
	options: VariantOption[];
}

type Selection = Record<string, string>;

const COLOR_ATTRIBUTE_PATTERN = /(?:color|colour|warna)/i;
const SORT_OPTIONS = [{ label: "Populer", value: "popular" }];

function activeItems(product: Product | null): ProductItem[] {
	if (!product) return [];
	return product.items.filter((item) => item.isActive);
}

function variantLabel(item: ProductItem): string {
	return item.name || item.productCode;
}

function minimumPrice(product: Product): number {
	const items = activeItems(product);
	if (items.length === 0) return 0;
	return Math.min(...items.map((item) => Number(item.price)));
}

function colorHexLookup(product: Product | null): Map<string, string> {
	const lookup = new Map<string, string>();
	for (const attribute of product?.category?.attributes ?? []) {
		for (const option of attribute.options ?? []) {
			if (option.hex) lookup.set(option.id, option.hex);
		}
	}
	return lookup;
}

function groupsFromVariants(
	items: ProductItem[],
	hexByOption: Map<string, string>,
): VariantGroup[] {
	const groups = new Map<string, VariantGroup>();

	for (const item of items) {
		for (const attribute of item.attributes ?? []) {
			const groupId = attribute.id || attribute.name;
			let group = groups.get(groupId);
			if (!group) {
				group = {
					id: groupId,
					name: attribute.name,
					sortOrder: attribute.sortOrder ?? 0,
					options: [],
				};
				groups.set(groupId, group);
			}
			const key = attribute.optionId || attribute.value;
			if (!group.options.some((option) => option.key === key)) {
				group.options.push({
					key,
					value: attribute.value,
					hex: hexByOption.get(attribute.optionId),
				});
			}
		}
	}

	return [...groups.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function groupsFromCategory(
	product: Product | null,
	items: ProductItem[],
): VariantGroup[] {
	return (product?.category?.attributes ?? [])
		.map((attribute) => ({
			id: attribute.id,
			name: attribute.name,
			sortOrder: attribute.sortOrder ?? 0,
			options: [...attribute.options]
				.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
				.map((option) => ({
					key: option.id,
					value: option.name,
					hex: option.hex,
				})),
		}))
		.map((group) => ({
			...group,
			options: group.options.filter((option) =>
				items.some((item) => variantHasOption(item, group, option)),
			),
		}))
		.filter((group) => group.options.length > 0)
		.sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildGroups(
	product: Product | null,
	items: ProductItem[],
): VariantGroup[] {
	const fromVariants = groupsFromVariants(items, colorHexLookup(product));
	if (fromVariants.length > 0) return fromVariants;
	return groupsFromCategory(product, items);
}

function defaultSelection(groups: VariantGroup[]): Selection {
	const selection: Selection = {};
	for (const group of groups) {
		if (group.options.length === 1) selection[group.id] = group.options[0].key;
	}
	return selection;
}

function variantHasOption(
	item: ProductItem,
	group: VariantGroup,
	option: VariantOption,
): boolean {
	const attribute = item.attributes?.find(
		(entry) => entry.id === group.id || entry.name === group.name,
	);
	if (attribute) {
		return (
			attribute.optionId === option.key ||
			attribute.value.toLowerCase() === option.value.toLowerCase()
		);
	}
	const haystack = `${item.name} ${item.productCode}`.toLowerCase();
	return haystack.includes(option.value.toLowerCase());
}

function matchesSelection(
	item: ProductItem,
	groups: VariantGroup[],
	selection: Selection,
): boolean {
	return groups.every((group) => {
		const chosen = selection[group.id];
		if (!chosen) return false;
		const option = group.options.find((candidate) => candidate.key === chosen);
		if (!option) return false;
		return variantHasOption(item, group, option);
	});
}

function optionAvailable(
	items: ProductItem[],
	groups: VariantGroup[],
	selection: Selection,
	groupId: string,
	optionKey: string,
): boolean {
	return items.some((item) =>
		groups.every((group) => {
			const chosen = group.id === groupId ? optionKey : selection[group.id];
			if (!chosen) return true;
			const option = group.options.find(
				(candidate) => candidate.key === chosen,
			);
			if (!option) return false;
			return variantHasOption(item, group, option);
		}),
	);
}

function attributeValue(item: ProductItem, matches: boolean): string {
	return (
		item.attributes?.find(
			(attribute) => COLOR_ATTRIBUTE_PATTERN.test(attribute.name) === matches,
		)?.value ?? ""
	);
}

function specsValue(item: ProductItem): string {
	return (item.attributes ?? [])
		.filter((attribute) => !COLOR_ATTRIBUTE_PATTERN.test(attribute.name))
		.map((attribute) => attribute.value)
		.join(" • ");
}

export default function Home() {
	const dispatch = useDispatch<AppDispatch>();
	const { flash, show, clear } = useFlash(3000);
	const [pagination, setPagination] = useState<Pagination>();
	const [pageCount, setPageCount] = useState<string>("1");
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [searchParams] = useSearchParams();
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [selection, setSelection] = useState<Selection>({});
	const [selectedItemId, setSelectedItemId] = useState<string>("");
	const [qty, setQty] = useState<number>(1);
	const [activeModal, setActiveModal] = useState<boolean>(false);

	const categoryId = searchParams.get("categoryId") ?? "";
	const brandId = searchParams.get("brandId") ?? "";
	const searchValue = searchParams.get("search") ?? "";

	const variants = useMemo(
		() => activeItems(selectedProduct),
		[selectedProduct],
	);
	const groups = useMemo(
		() => buildGroups(selectedProduct, variants),
		[selectedProduct, variants],
	);
	const usesGroups = groups.length > 0;
	const allSelected =
		groups.length > 0 && groups.every((group) => selection[group.id]);

	const selectedItem = useMemo(() => {
		if (variants.length === 0) return null;
		if (usesGroups) {
			return (
				variants.find((item) => matchesSelection(item, groups, selection)) ??
				null
			);
		}
		return variants.find((item) => item.id === selectedItemId) ?? null;
	}, [variants, usesGroups, groups, selection, selectedItemId]);

	const unitPrice = selectedItem ? Number(selectedItem.price) : 0;
	const maxStock = selectedItem?.stock ?? 0;

	function openProduct(product: Product): void {
		const items = activeItems(product);
		const builtGroups = buildGroups(product, items);

		setSelectedProduct(product);
		setQty(1);
		if (builtGroups.length > 0) {
			setSelection(defaultSelection(builtGroups));
			setSelectedItemId("");
		} else {
			setSelection({});
			setSelectedItemId(items.length === 1 ? items[0].id : "");
		}
		setActiveModal(true);
	}

	function selectOption(groupId: string, optionKey: string): void {
		setSelection((prev) => ({ ...prev, [groupId]: optionKey }));
	}

	function clearOption(groupId: string): void {
		setSelection((prev) => {
			const next = { ...prev };
			delete next[groupId];
			return next;
		});
	}

	function selectedOptionName(group: VariantGroup): string {
		return (
			group.options.find((option) => option.key === selection[group.id])
				?.value ?? ""
		);
	}

	function handleAddToCart(e): void {
		e.preventDefault();
		if (!selectedProduct || !selectedItem) {
			show("Pilih varian yang tersedia dulu.", "error");
			return;
		}
		if (selectedItem.stock < 1) {
			show("Stok varian ini habis.", "error");
			return;
		}
		if (qty > selectedItem.stock) {
			show(`Stok tersisa ${selectedItem.stock} item.`, "error");
			return;
		}

		const colorGroup = groups.find((group) =>
			COLOR_ATTRIBUTE_PATTERN.test(group.name),
		);
		const color = usesGroups
			? colorGroup
				? selectedOptionName(colorGroup)
				: ""
			: attributeValue(selectedItem, true);
		const specs = usesGroups
			? groups
					.filter((group) => group !== colorGroup)
					.map((group) => selectedOptionName(group))
					.filter(Boolean)
					.join(" • ")
			: specsValue(selectedItem);

		const cartItem: CartItem = {
			id: selectedItem.id,
			productItemId: selectedItem.id,
			productId: selectedProduct.id,
			productCode: selectedItem.productCode,
			name: selectedProduct.name,
			category: selectedProduct.category?.name ?? "",
			image: selectedProduct.image?.url ?? null,
			alt: selectedProduct.image?.alt ?? selectedProduct.name,
			color,
			specs,
			price: Number(selectedItem.price),
			total: Number(selectedItem.price) * qty,
			qty,
			stock: selectedItem.stock,
		};

		dispatch(addToCart(cartItem));
		setActiveModal(false);
		show(`${selectedProduct.name} ditambahkan ke keranjang.`);
	}

	useEffect(() => {
		async function getProduct() {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (categoryId) params.set("categoryId", categoryId);
				if (brandId) params.set("brandId", brandId);
				params.set("limit", "8");
				params.set("page", pageCount);
				if (searchValue.length >= 3) params.set("search", searchValue);

				const response = await apiFetch(
					`/api/v1/products?${params.toString()}`,
				);
				const result = await response.json();
				setProducts(result.data);
				setPagination(result.meta.pagination);
			} catch (error) {
				console.error(error);
				show("Gagal memuat produk.", "error");
			} finally {
				setLoading(false);
			}
		}
		getProduct();
	}, [categoryId, brandId, pageCount, searchValue, show]);

	return (
		<>
			<Modal
				open={activeModal}
				onOpenChange={setActiveModal}
				size="xl"
				label={selectedProduct?.name ?? "Pilih varian produk"}
			>
				<form
					onSubmit={handleAddToCart}
					className="flex flex-col"
				>
					<header className="flex w-full flex-col gap-4 border-b border-base-border pb-4">
						<div className="flex w-full items-start justify-between">
							<div className="flex items-center gap-4">
								<section className="h-35 w-30 overflow-hidden rounded-lg bg-base">
									{selectedProduct?.image?.url && (
										<img
											src={selectedProduct.image.url}
											alt={selectedProduct.image.alt}
											className="size-full object-cover"
										/>
									)}
								</section>
								<section className="flex flex-col justify-center gap-1">
									<h6 className="font-semibold text-base text-text-h">
										{selectedProduct?.name ?? "Produk"}
									</h6>
									<p className="text-xs text-text">
										{selectedProduct?.category?.name} | Ready stock
									</p>
									<p className="font-semibold text-base text-primary">
										{formatRupiah(
											selectedItem
												? unitPrice
												: selectedProduct
													? minimumPrice(selectedProduct)
													: 0,
										)}
									</p>
								</section>
							</div>
							<div>
								<Button
									onClick={() => setActiveModal(false)}
									aria-label="Close"
									variant="ghost"
									size="icon"
								>
									<X size={16} />
								</Button>
							</div>
						</div>
						<p className="text-xs text-text">
							Pilih varian dulu sebelum ke Keranjang
						</p>
					</header>

					<main className="mt-2 flex w-full flex-col gap-2">
						{usesGroups &&
							groups.map((group) => {
								const isColor = COLOR_ATTRIBUTE_PATTERN.test(group.name);
								return (
									<section
										key={group.id}
										className="flex w-full flex-col py-3 text-sm"
									>
										<header className="flex h-fit w-full items-center justify-between">
											<p className="text-sm font-semibold text-text-h">
												<span className="mr-3 rounded-lg border-l-5 border-primary bg-primary"></span>
												{group.name}
											</p>
											<p className="text-xs font-medium text-primary">
												Wajib dipilih
											</p>
										</header>
										<main className="mt-2 flex flex-wrap gap-3">
											{group.options.map((option) => {
												const available = optionAvailable(
													variants,
													groups,
													selection,
													group.id,
													option.key,
												);
												const id = `opt-${group.id}-${option.key}`;
												return (
													<label
														key={option.key}
														htmlFor={id}
														aria-label={`${group.name} ${option.value}`}
														className="group flex cursor-pointer flex-col items-center gap-2"
													>
														<input
															className="peer sr-only"
															name={group.id}
															type="radio"
															id={id}
															value={option.key}
															checked={selection[group.id] === option.key}
															disabled={!available}
															onClick={() => {
																if (selection[group.id] === option.key) {
																	clearOption(group.id);
																}
															}}
															onChange={() =>
																selectOption(group.id, option.key)
															}
														/>
														{isColor ? (
															<>
																<div className="centerized size-13.5 rounded-full border border-white peer-checked:border-primary peer-disabled:opacity-40">
																	<div
																		className="size-10 rounded-full"
																		style={{
																			backgroundColor: option.hex ?? "#e5e7eb",
																		}}
																	></div>
																</div>
																<p className="text-xs font-semibold group-[:has(input:checked)]:text-primary">
																	{option.value}
																</p>
															</>
														) : (
															<div className="centerized h-12 min-w-24 rounded-lg border border-base-border px-4 peer-checked:border-primary peer-checked:bg-primary/10 peer-disabled:opacity-40">
																<p className="text-sm font-semibold text-text-h group-[:has(input:checked)]:text-primary">
																	{option.value}
																</p>
															</div>
														)}
													</label>
												);
											})}
										</main>
									</section>
								);
							})}

						{!usesGroups && (
							<section className="flex w-full flex-col py-3 text-sm">
								<header className="flex h-fit w-full items-center justify-between">
									<p className="text-sm font-semibold text-text-h">
										<span className="mr-3 rounded-lg border-l-5 border-primary bg-primary"></span>
										Varian
									</p>
									<p className="text-xs font-medium text-primary">
										Wajib dipilih
									</p>
								</header>
								<main className="mt-2 flex flex-col gap-2">
									{variants.length === 0 && (
										<p className="py-4 text-center text-sm">
											Belum ada varian tersedia.
										</p>
									)}
									{variants.map((item) => (
										<label
											key={item.id}
											htmlFor={`variant-${item.id}`}
											aria-label={variantLabel(item)}
											className="group flex cursor-pointer flex-col"
										>
											<input
												className="peer sr-only"
												name="variant"
												type="radio"
												id={`variant-${item.id}`}
												value={item.id}
												checked={selectedItemId === item.id}
												disabled={item.stock < 1}
												onClick={() => {
													if (selectedItemId === item.id) setSelectedItemId("");
												}}
												onChange={() => setSelectedItemId(item.id)}
											/>
											<div className="centerized h-16 w-full overflow-hidden rounded-lg border border-base-border peer-checked:border-primary peer-checked:bg-primary/10 peer-disabled:opacity-50">
												<div className="flex w-full items-center justify-between gap-3 px-4">
													<div className="flex min-w-0 flex-1 flex-col">
														<p className="text-sm font-medium text-text-h group-[:has(input:checked)]:text-primary">
															{variantLabel(item)}
														</p>
														<p className="text-2xs text-text">
															{item.productCode}
														</p>
													</div>
													<p className="shrink-0 text-sm font-semibold text-primary">
														{formatRupiah(Number(item.price))}
													</p>
													<p
														className={`shrink-0 rounded-lg bg-base px-3 py-1.5 text-xs font-semibold ${
															item.stock > 0
																? "text-text-h"
																: "text-deep-danger/80"
														}`}
													>
														{item.stock > 0 ? `Stok ${item.stock}` : "Habis"}
													</p>
												</div>
											</div>
										</label>
									))}
								</main>
							</section>
						)}

						<footer className="mt-6 flex flex-col gap-3">
							<div className="flex h-17 w-full flex-col justify-center gap-1 rounded-lg border border-base-border bg-base p-4 text-left">
								<p className="text-2xs text-text">VARIAN TERPILIH</p>
								<div className="flex items-center gap-2">
									<p className="text-sm font-semibold text-text-h">
										{selectedItem
											? variantLabel(selectedItem)
											: allSelected
												? "Kombinasi tidak tersedia"
												: "-"}
									</p>
									{selectedItem && (
										<p className="text-2xs text-text">
											{selectedItem.productCode}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="flex h-11 w-35 items-center justify-between rounded-lg border border-base-border">
										<Button
											variant="inverse"
											onClick={() => setQty((prev) => Math.max(1, prev - 1))}
										>
											<Minus
												size={14}
												strokeWidth={3}
											/>
										</Button>
										<span className="text-sm font-semibold text-text-h">
											{qty}
										</span>
										<Button
											variant="inverse"
											disabled={qty >= maxStock}
											onClick={() =>
												setQty((prev) =>
													maxStock > 0 ? Math.min(maxStock, prev + 1) : prev,
												)
											}
										>
											<Plus
												size={14}
												strokeWidth={3}
											/>
										</Button>
									</div>
									<p className="text-lg font-semibold text-text-h">
										{formatRupiah(unitPrice * qty)}
									</p>
								</div>
								<Button
									variant="primary"
									type="submit"
									disabled={!selectedItem || maxStock < 1}
								>
									Tambah Ke Keranjang
								</Button>
							</div>
						</footer>
					</main>
				</form>
			</Modal>

			<div className="flex w-full flex-col px-3">
				<Toast
					message={flash?.message}
					variant={flash?.variant}
					onDismiss={clear}
				/>
				<ParamsSection />
				{loading ? (
					<CardSkel count={3} />
				) : (
					<ProductGrid>
						{products?.map((item) => (
							<ProductCard
								key={item.id}
								media={
									item?.image?.url ? (
										<div className="h-full w-full">
											<img
												src={item.image.url}
												className="h-full w-full object-cover"
												alt={item.image.alt}
											/>
										</div>
									) : null
								}
							>
								<p className="text-2xs text-text">{item.brand?.name}</p>
								<p className="line-clamp-2 text-sm font-medium text-text-h">
									{item.name}
								</p>
								<div className="mt-auto flex items-center justify-between pt-1">
									<p className="font-semibold text-base text-text-h">
										{formatRupiah(minimumPrice(item))}
									</p>
									<Button
										onClick={() => openProduct(item)}
										size="icon"
										className="size-10 shrink-0 cursor-pointer rounded-full"
									>
										<ShoppingCart
											size={16}
											strokeWidth={2}
										/>
									</Button>
								</div>
							</ProductCard>
						))}
					</ProductGrid>
				)}
				{!loading && products?.length < 1 && (
					<div className="centerized h-50">
						<p className="text-sm text-text">Produk tidak ditemukan.</p>
					</div>
				)}
				{pagination && (
					<PaginationControls
						totalLabel={`Menampilkan ${products?.length} dari ${pagination.total_items} produk`}
						pageCount={Math.ceil(pagination.total_items / pagination.limit)}
						safePage={(pagination.page ?? 1) - 1}
						onPageChange={(page) => setPageCount(String(page + 1))}
					/>
				)}
			</div>
		</>
	);
}

function ParamsSection() {
	const [searchParams, setSearchParams] = useSearchParams();

	function handleSearchProduct(e): void {
		if (e.target.value.length >= 3) {
			setSearchParams({ search: e.target.value });
		} else if (e.target.value.length === 0) {
			setSearchParams({ search: "" });
		}
	}

	return (
		<div className="mb-4 flex w-full items-center justify-between py-3">
			<form
				action=""
				className="flex w-full justify-between"
			>
				<Input
					type="text"
					defaultValue={searchParams.get("search") ?? ""}
					onChange={handleSearchProduct}
					placeholder="Cari produk.."
					className="w-70"
				/>

				<Select
					label="Urutkan"
					defaultValue="popular"
					items={SORT_OPTIONS}
					className="w-40"
				/>
			</form>
		</div>
	);
}
