import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import Button from "../../components/ui/button";
import ErrorBanner from "../../components/ui/error-banner";
import FilterPills from "../../components/ui/filter-pills";
import ListToolbar, {
	ListSearch,
	ListSort,
} from "../../components/ui/list-toolbar";
import { ConfirmModal } from "../../components/ui/modal";
import Section from "../../components/ui/section";
import Toast from "../../components/ui/toast";
import AdjustStockModal from "../../features/inventories/components/AdjustStockModal";
import ProductItemMovementsModal from "../../features/inventories/components/ProductItemMovementsModal";
import ProductMovementsModal from "../../features/inventories/components/ProductMovementsModal";
import {
	type Product,
	type ProductItem,
	deleteProduct as deleteProductApi,
	deleteProductItem as deleteProductItemApi,
} from "../../features/products/api";
import ProductFormModal from "../../features/products/components/ProductFormModal";
import ProductOverview from "../../features/products/components/ProductOverview";
import ProductTable from "../../features/products/components/ProductTable";
import {
	SORT_OPTIONS,
	toNumber,
	type SortBy,
	type StatusFilter,
} from "../../features/products/format";
import { useProductsList } from "../../features/products/hooks/useProductsList";
import ProductTransactionReportModal from "../../features/reports/components/ProductTransactionReportModal";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";
import type { RootState } from "../../store";

export default function ProductsManagementDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [page, setPage] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [creatingProduct, setCreatingProduct] = useState(false);
	const [returnToForm, setReturnToForm] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
	const [deletingItem, setDeletingItem] = useState(false);
	const [showAdjust, setShowAdjust] = useState(false);
	const [adjustItem, setAdjustItem] = useState<ProductItem | null>(null);
	const [movementItem, setMovementItem] = useState<ProductItem | null>(null);
	const [movementProduct, setMovementProduct] = useState<Product | null>(null);
	const [reportProduct, setReportProduct] = useState<Product | null>(null);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const pageSize = 8;

	const { flash, show, clear } = useFlash();
	const user = useSelector((state: RootState) => state.auth.user);

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
	const formProduct = creatingProduct ? null : selected;

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	const openProductForm = useCallback(
		(product: Product) => {
			setSelectedId(product.id);
			setCreatingProduct(false);
			setShowForm(true);
		},
		[setSelectedId],
	);

	const openCreateForm = useCallback(() => {
		setCreatingProduct(true);
		setShowForm(true);
	}, []);

	const handleAskDeleteProduct = useCallback(
		(product: Product) => {
			setSelectedId(product.id);
			setShowDelete(true);
		},
		[setSelectedId],
	);

	const handleDeleteVariant = useCallback((item: ProductItem) => {
		setItemToDelete(item);
		setReturnToForm(true);
		setShowForm(false);
	}, []);

	const handleAdjustVariant = useCallback((item: ProductItem) => {
		setAdjustItem(item);
		setReturnToForm(true);
		setShowForm(false);
		setShowAdjust(true);
	}, []);

	const handleViewMovements = useCallback((item: ProductItem) => {
		setMovementItem(item);
		setReturnToForm(true);
		setShowForm(false);
	}, []);

	const handleViewProductMovements = useCallback((product: Product) => {
		setMovementProduct(product);
	}, []);

	const handleProductMovementsOpenChange = useCallback((o: boolean) => {
		if (!o) setMovementProduct(null);
	}, []);

	const handleViewReport = useCallback((product: Product) => {
		setReportProduct(product);
	}, []);

	const handleReportOpenChange = useCallback((o: boolean) => {
		if (!o) setReportProduct(null);
	}, []);

	const reopenForm = useCallback(() => {
		if (returnToForm) {
			setReturnToForm(false);
			setShowForm(true);
		}
	}, [returnToForm]);

	const handleAdjustOpenChange = useCallback(
		(o: boolean) => {
			setShowAdjust(o);
			if (!o) reopenForm();
		},
		[reopenForm],
	);

	const handleMovementsOpenChange = useCallback(
		(o: boolean) => {
			if (!o) setMovementItem(null);
			if (!o) reopenForm();
		},
		[reopenForm],
	);

	const handleDeleteProductFromForm = useCallback(() => {
		setShowForm(false);
		setShowDelete(true);
	}, []);

	const handleDeleteItem = async () => {
		if (!itemToDelete) return;
		setDeletingItem(true);
		try {
			await deleteProductItemApi(itemToDelete.id);
			show("Varian berhasil dihapus");
			setItemToDelete(null);
			reopenForm();
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
							<ListSearch
								placeholder="Search products..."
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
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
							<ListSort
								label="Sort this page of products"
								value={sortBy}
								onValueChange={(v) => setSortBy(v as SortBy)}
								items={SORT_OPTIONS}
							/>
							<Button
								size="sm"
								onClick={openCreateForm}
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
					onOpenDetail={openProductForm}
					onEdit={openProductForm}
					onDelete={handleAskDeleteProduct}
					onViewMovements={handleViewProductMovements}
					onViewReport={handleViewReport}
					onToggleAll={toggleAllPage}
					onToggleOne={toggleOne}
					totalLabel={`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : sorted.length} products`}
					pageCount={pageCount}
					safePage={safePage}
					onPageChange={setPage}
				/>
			</Section>

			<ProductFormModal
				open={showForm}
				onOpenChange={setShowForm}
				product={formProduct}
				onSuccess={(message, variant) => {
					show(message ?? "Product berhasil disimpan", variant);
					fetchProducts();
				}}
				onDeleteVariant={handleDeleteVariant}
				onAdjustStock={handleAdjustVariant}
				onViewMovements={handleViewMovements}
				onDeleteProduct={handleDeleteProductFromForm}
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
			<ProductTransactionReportModal
				open={Boolean(reportProduct)}
				onOpenChange={handleReportOpenChange}
				generatedBy={user?.fullname ?? "Admin"}
				onNotify={show}
				product={
					reportProduct
						? { id: reportProduct.id, name: reportProduct.name }
						: null
				}
			/>
			<ProductMovementsModal
				open={Boolean(movementProduct)}
				onOpenChange={handleProductMovementsOpenChange}
				generatedBy={user?.fullname ?? "Admin"}
				onNotify={show}
				product={
					movementProduct
						? {
								id: movementProduct.id,
								name: movementProduct.name,
								code: null,
								itemIds: (movementProduct.items ?? []).map((item) => item.id),
							}
						: null
				}
			/>
			<ProductItemMovementsModal
				open={Boolean(movementItem)}
				onOpenChange={handleMovementsOpenChange}
				generatedBy={user?.fullname ?? "Admin"}
				onNotify={show}
				item={
					movementItem
						? {
								id: movementItem.id,
								label: movementItem.name,
								code: movementItem.productCode ?? null,
							}
						: null
				}
			/>
			<ConfirmModal
				open={Boolean(itemToDelete)}
				onOpenChange={(o) => {
					if (!o) {
						setItemToDelete(null);
						reopenForm();
					}
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
