import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "../../components/ui/button";
import FilterPills from "../../components/ui/filter-pills";
import Input from "../../components/ui/input";
import { ConfirmModal } from "../../components/ui/modal";
import Select from "../../components/ui/select";
import {
	type Product,
	type ProductItem,
	deleteProduct as deleteProductApi,
	deleteProductItem as deleteProductItemApi,
} from "../../features/products/api";
import ProductDetailModal from "../../features/products/components/ProductDetailModal";
import ProductFormModal from "../../features/products/components/ProductFormModal";
import ProductItemFormModal from "../../features/products/components/ProductItemFormModal";
import ProductOverview from "../../features/products/components/ProductOverview";
import ProductTable from "../../features/products/components/ProductTable";
import {
	SORT_OPTIONS,
	type SortBy,
	type StatusFilter,
} from "../../features/products/format";
import { useProductsList } from "../../features/products/hooks/useProductsList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function ProductsManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [showForm, setShowForm] = useState(false);
	const [formProduct, setFormProduct] = useState<Product | null>(null);
	const [showDetail, setShowDetail] = useState(false);
	const [returnToDetail, setReturnToDetail] = useState(false);
	const [showItemForm, setShowItemForm] = useState(false);
	const [formItem, setFormItem] = useState<ProductItem | null>(null);
	const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
	const [deletingItem, setDeletingItem] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [toastVariant, setToastVariant] = useState<"success" | "error">(
		"success",
	);
	const pageSize = 8;

	const {
		products,
		loading,
		error: fetchError,
		fetchProducts,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
		categoryOptions,
		brandOptions,
	} = useProductsList({
		debouncedSearch,
		statusFilter,
		sortBy,
		page,
		pageSize,
	});

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	useEffect(() => {
		queueMicrotask(() => {
			if (paged.length > 0)
				setSelectedId((prev) =>
					prev && paged.some((p) => p.id === prev) ? prev : paged[0]!.id,
				);
			else if (products.length === 0) setSelectedId(null);
		});
	}, [paged, products.length]);

	const flash = useCallback(
		(msg: string, variant: "success" | "error" = "success") => {
			setToast(msg);
			setToastVariant(variant);
			setTimeout(() => setToast(null), 2800);
		},
		[],
	);

	const selected = useMemo(() => {
		if (!selectedId) return sorted[0] ?? null;
		return sorted.find((p) => p.id === selectedId) ?? sorted[0] ?? null;
	}, [sorted, selectedId]);

	const allPageSelected =
		paged.length > 0 && paged.every((p) => selectedIds.has(p.id));
	const somePageSelected =
		paged.some((p) => selectedIds.has(p.id)) && !allPageSelected;
	const toggleAllPage = (checked: boolean) =>
		setSelectedIds((prev) => {
			const n = new Set(prev);
			if (checked) paged.forEach((p) => n.add(p.id));
			else paged.forEach((p) => n.delete(p.id));
			return n;
		});
	const toggleOne = (id: string, checked: boolean) =>
		setSelectedIds((prev) => {
			const n = new Set(prev);
			if (checked) n.add(id);
			else n.delete(id);
			return n;
		});

	const handleOpenDetail = useCallback((product: Product) => {
		setSelectedId(product.id);
		setShowDetail(true);
	}, []);

	const handleEditProduct = useCallback((product: Product) => {
		setSelectedId(product.id);
		setFormProduct(product);
		setShowForm(true);
	}, []);

	const handleAskDeleteProduct = useCallback((product: Product) => {
		setSelectedId(product.id);
		setShowDelete(true);
	}, []);

	const handleAddVariant = useCallback(() => {
		setFormItem(null);
		setReturnToDetail(true);
		setShowDetail(false);
		setShowItemForm(true);
	}, []);

	const handleEditVariant = useCallback((item: ProductItem) => {
		setFormItem(item);
		setReturnToDetail(true);
		setShowDetail(false);
		setShowItemForm(true);
	}, []);

	const handleEditProductFromDetail = useCallback(() => {
		setShowDetail(false);
		setFormProduct(selected);
		setShowForm(true);
	}, [selected]);

	const handleDeleteProductFromDetail = useCallback(() => {
		setShowDetail(false);
		setShowDelete(true);
	}, []);

	const handleItemFormOpenChange = useCallback(
		(o: boolean) => {
			setShowItemForm(o);
			if (!o && returnToDetail) {
				setReturnToDetail(false);
				setShowDetail(true);
			}
		},
		[returnToDetail],
	);

	const handleDeleteItem = async () => {
		if (!itemToDelete) return;
		setDeletingItem(true);
		try {
			await deleteProductItemApi(itemToDelete.id);
			flash("Varian berhasil dihapus");
			setItemToDelete(null);
			await fetchProducts();
		} catch (error) {
			flash(
				error instanceof Error ? error.message : "Gagal menghapus varian",
				"error",
			);
		} finally {
			setDeletingItem(false);
		}
	};

	const handleDelete = async () => {
		if (!selected) return;
		setDeleting(true);
		try {
			await deleteProductApi(selected.id);
			flash("Product berhasil dihapus");
			setShowDelete(false);
			await fetchProducts();
		} catch (error) {
			flash(
				error instanceof Error ? error.message : "Gagal menghapus product",
				"error",
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			{toast && (
				<div
					className={`rounded-lg border px-4 py-2 text-sm ${toastVariant === "success" ? "border-valid bg-valid text-deep-valid" : "border-danger bg-danger text-deep-danger"}`}
					role={toastVariant === "error" ? "alert" : "status"}
				>
					{toast}
				</div>
			)}
			{fetchError && (
				<div
					className="rounded-lg border border-danger bg-danger px-4 py-3 text-sm text-deep-danger"
					role="alert"
				>
					{fetchError}{" "}
					<button
						type="button"
						onClick={fetchProducts}
						className="ml-2 font-semibold underline"
					>
						Coba lagi
					</button>
				</div>
			)}

			<ProductOverview
				stats={stats}
				loading={loading}
			/>

			<section
				aria-labelledby="products-heading"
				className="flex flex-col gap-3"
			>
				<h2
					id="products-heading"
					className="text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Products
				</h2>

				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
						<Input
							size="sm"
							placeholder="Search products..."
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
							className="w-full sm:max-w-[228px]"
							aria-label="Search products"
						/>
						<FilterPills
							variant="segmented"
							label="Filter status"
							items={[
								{ label: "All", value: "All", badge: stats.total },
								{ label: "Active", value: "Active", badge: stats.active },
								{
									label: "Inactive",
									value: "Inactive",
									badge: stats.inactive,
								},
							]}
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as StatusFilter)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Select
							label="Sort products"
							value={sortBy}
							onValueChange={(v) => setSortBy(v as SortBy)}
							items={SORT_OPTIONS}
							className="size-9 text-xs"
							placeholder="Sort"
						/>
						<Button
							size="sm"
							onClick={() => {
								setFormProduct(null);
								setShowForm(true);
							}}
						>
							<Plus size={14} />
							Add Product
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<ProductTable
						loading={loading}
						paged={paged}
						selectedId={selected?.id}
						selectedIds={selectedIds}
						allPageSelected={allPageSelected}
						somePageSelected={somePageSelected}
						onOpenDetail={handleOpenDetail}
						onEdit={handleEditProduct}
						onDelete={handleAskDeleteProduct}
						onToggleAll={toggleAllPage}
						onToggleOne={toggleOne}
						totalLabel={`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : sorted.length} products`}
						pageCount={pageCount}
						safePage={safePage}
						onPageChange={setPage}
					/>

					<ProductDetailModal
						open={showDetail}
						onOpenChange={setShowDetail}
						product={selected}
						onDelete={handleDeleteProductFromDetail}
						onEdit={handleEditProductFromDetail}
						onAddVariant={handleAddVariant}
						onEditVariant={handleEditVariant}
						onDeleteVariant={setItemToDelete}
					/>
				</div>
			</section>

			<ProductFormModal
				open={showForm}
				onOpenChange={setShowForm}
				product={formProduct}
				categoryOptions={categoryOptions}
				brandOptions={brandOptions}
				onSuccess={(message, variant) => {
					flash(message ?? "Product berhasil disimpan", variant);
					fetchProducts();
				}}
			/>
			<ProductItemFormModal
				open={showItemForm}
				onOpenChange={handleItemFormOpenChange}
				product={selected}
				item={formItem}
				onSuccess={() => {
					flash("Varian berhasil disimpan");
					fetchProducts();
				}}
			/>
			<ConfirmModal
				open={Boolean(itemToDelete)}
				onOpenChange={(o) => {
					if (!o) setItemToDelete(null);
				}}
				title="Delete varian"
				description={
					itemToDelete
						? `Hapus varian "${itemToDelete.name}"? Tindakan ini soft delete.`
						: undefined
				}
				body="Varian akan dihapus (soft delete) dan tidak bisa dijual lagi."
				loading={deletingItem}
				onConfirm={handleDeleteItem}
			/>
			<ConfirmModal
				open={showDelete}
				onOpenChange={setShowDelete}
				title="Delete product"
				description={
					selected
						? `Hapus "${selected.name}"? Tindakan ini soft delete.`
						: undefined
				}
				body="Product akan dihapus (soft delete) dan tidak muncul di katalog."
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
