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
import {
	type Brand,
	deleteBrand as deleteBrandApi,
} from "../../features/brands/api";
import BrandDetailPanel from "../../features/brands/components/BrandDetailPanel";
import BrandFormModal from "../../features/brands/components/BrandFormModal";
import BrandOverview from "../../features/brands/components/BrandOverview";
import BrandTable from "../../features/brands/components/BrandTable";
import {
	SORT_OPTIONS,
	STATUS_ITEMS,
	type SortBy,
	type StatusFilter,
} from "../../features/brands/format";
import { useBrandsList } from "../../features/brands/hooks/useBrandsList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";

export default function BrandsDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [page, setPage] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [formBrand, setFormBrand] = useState<Brand | null>(null);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const pageSize = 8;

	const { flash, show, clear } = useFlash();

	const {
		brands,
		loading,
		error: fetchError,
		fetchBrands,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	} = useBrandsList({
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
	} = useRowSelection(paged, brands.length);

	const selected = useSelectedItem(sorted, selectedId, sorted[0]);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	const handleCreate = useCallback(() => {
		setFormBrand(null);
		setShowForm(true);
	}, []);

	const handleEdit = useCallback(
		(brand: Brand) => {
			setSelectedId(brand.id);
			setFormBrand(brand);
			setShowForm(true);
		},
		[setSelectedId],
	);

	const handleAskDelete = useCallback(
		(brand: Brand) => {
			setSelectedId(brand.id);
			setShowDelete(true);
		},
		[setSelectedId],
	);

	const handleDelete = async () => {
		if (!selected) return;
		setDeleting(true);
		try {
			await deleteBrandApi(selected.id);
			show("Brand berhasil dihapus");
			setShowDelete(false);
			await fetchBrands();
		} catch (error) {
			show(
				error instanceof Error ? error.message : "Gagal menghapus brand",
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
					onRetry={fetchBrands}
				/>
			)}

			<BrandOverview
				stats={stats}
				loading={loading}
			/>

			<Section title="Brands">
				<ListToolbar
					filters={
						<>
							<Input
								size="sm"
								placeholder="Search brands..."
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
								className="w-full sm:max-w-[228px]"
								aria-label="Search brands"
							/>
							<FilterPills
								label="Filter status"
								items={STATUS_ITEMS}
								value={statusFilter}
								onValueChange={(v) => setStatusFilter(v as StatusFilter)}
							/>
						</>
					}
					actions={
						<>
							<Select
								label="Sort brands"
								value={sortBy}
								onValueChange={(v) => setSortBy(v as SortBy)}
								items={SORT_OPTIONS}
								className="size-9 text-xs"
								placeholder="Sort"
							/>
							<Button
								size="sm"
								onClick={handleCreate}
							>
								<Plus size={14} />
								Add Brand
							</Button>
						</>
					}
				/>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
					<BrandTable
						loading={loading}
						paged={paged}
						selectedId={selected?.id}
						selectedIds={selectedIds}
						allPageSelected={allPageSelected}
						somePageSelected={somePageSelected}
						onSelect={setSelectedId}
						onEdit={handleEdit}
						onDelete={handleAskDelete}
						onToggleAll={toggleAllPage}
						onToggleOne={toggleOne}
						pageCount={pageCount}
						safePage={safePage}
						onPageChange={setPage}
						totalLabel={`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : sorted.length} brands`}
					/>
					<BrandDetailPanel
						brand={selected}
						onEdit={() => {
							setFormBrand(selected ?? null);
							setShowForm(true);
						}}
						onDelete={() => setShowDelete(true)}
					/>
				</div>
			</Section>

			<BrandFormModal
				open={showForm}
				onOpenChange={setShowForm}
				brand={formBrand}
				onSuccess={() => {
					show("Brand berhasil disimpan");
					fetchBrands();
				}}
			/>

			<ConfirmModal
				open={showDelete}
				onOpenChange={setShowDelete}
				title="Delete brand"
				description={
					selected
						? `Hapus "${selected.name}"? Tindakan ini soft delete.`
						: undefined
				}
				body="Brand akan dihapus (soft delete) dan tidak muncul di daftar."
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
