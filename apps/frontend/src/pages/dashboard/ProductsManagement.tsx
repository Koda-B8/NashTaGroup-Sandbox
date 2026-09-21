import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Button from "../../components/ui/button";
import ErrorBanner from "../../components/ui/error-banner";
import FilterPills from "../../components/ui/filter-pills";
import Input from "../../components/ui/input";
import ListToolbar from "../../components/ui/list-toolbar";
import { ConfirmModal } from "../../components/ui/modal";
import Section from "../../components/ui/section";
import Select from "../../components/ui/select";
import Toast from "../../components/ui/toast";
import AdjustStockModal from "../../features/inventories/components/AdjustStockModal";
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
	toNumber,
	type SortBy,
	type StatusFilter,
} from "../../features/products/format";
import { useProductsList } from "../../features/products/hooks/useProductsList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";

export default function ProductsManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [page, setPage] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [formProduct, setFormProduct] = useState<Product | null>(null);
	const [showDetail, setShowDetail] = useState(false);
	const [returnToDetail, setReturnToDetail] = useState(false);
	const [showItemForm, setShowItemForm] = useState(false);
	const [formItem, setFormItem] = useState<ProductItem | null>(null);
	const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
	const [deletingItem, setDeletingItem] = useState(false);
	const [showAdjust, setShowAdjust] = useState(false);
	const [adjustItem, setAdjustItem] = useState<ProductItem | null>(null);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const pageSize = 8;

	const { flash, show, clear } = useFlash();

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

	const {
		selectedId,
		setSelectedId,
		selectedIds,
		allPageSelected,
		somePageSelected,
		toggleAllPage,
		toggleOne,
	} = useRowSelection(paged, products.length);

	const selected = useSelectedItem(sorted, selectedId, sorted[0] ?? null);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	const handleOpenDetail = useCallback(
		(product: Product) => {
			setSelectedId(product.id);
			setShowDetail(true);
		},
		[setSelectedId],
	);

	const handleEditProduct = useCallback(
		(product: Product) => {
			setSelectedId(product.id);
			setFormProduct(product);
			setShowForm(true);
		},
		[setSelectedId],
	);

	const handleAskDeleteProduct = useCallback(
		(product: Product) => {
			setSelectedId(product.id);
			setShowDelete(true);
		},
		[setSelectedId],
	);

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

	const handleAdjustVariant = useCallback((item: ProductItem) => {
		setAdjustItem(item);
		setReturnToDetail(true);
		setShowDetail(false);
		setShowAdjust(true);
	}, []);

	const handleAdjustOpenChange = useCallback(
		(o: boolean) => {
			setShowAdjust(o);
			if (!o && returnToDetail) {
				setReturnToDetail(false);
				setShowDetail(true);
			}
		},
		[returnToDetail],
	);

	const handleEditProductFromDetail = useCallback(() => {
		setShowDetail(false);
		setFormProduct(selected ?? null);
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
			show("Varian berhasil dihapus");
			setItemToDelete(null);
			await fetchProducts();
		} catch (error) {
			show(
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
			show("Product berhasil dihapus");
			setShowDelete(false);
			await fetchProducts();
		} catch (error) {
			show(
				error instanceof Error ? error.message : "Gagal menghapus product",
				"error",
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<Toast
				message={flash?.message}
				variant={flash?.variant}
				onDismiss={clear}
			/>
			{fetchError && (
				<ErrorBanner
					message={fetchError}
					onRetry={fetchProducts}
				/>
			)}

			<ProductOverview
				stats={stats}
				loading={loading}
			/>

			<Section title="Products">
				<ListToolbar
					filters={
						<>
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
						</>
					}
					actions={
						<>
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
						</>
					}
				/>

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
					onAdjustStock={handleAdjustVariant}
				/>
			</Section>

			<ProductFormModal
				open={showForm}
				onOpenChange={setShowForm}
				product={formProduct}
				categoryOptions={categoryOptions}
				brandOptions={brandOptions}
				onSuccess={(message, variant) => {
					show(message ?? "Product berhasil disimpan", variant);
					fetchProducts();
				}}
			/>
			<ProductItemFormModal
				open={showItemForm}
				onOpenChange={handleItemFormOpenChange}
				product={selected}
				item={formItem}
				onSuccess={() => {
					show("Varian berhasil disimpan");
					fetchProducts();
				}}
			/>
			<AdjustStockModal
				open={showAdjust}
				onOpenChange={handleAdjustOpenChange}
				target={
					adjustItem
						? {
								id: adjustItem.id,
								label: `${selected?.name ?? ""} · ${adjustItem.name}`,
								stock: toNumber(adjustItem.stock),
							}
						: null
				}
				onSuccess={(adjustment) => {
					show(
						`Stok diperbarui: ${adjustment.stockBefore} → ${adjustment.stockAfter}`,
					);
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
