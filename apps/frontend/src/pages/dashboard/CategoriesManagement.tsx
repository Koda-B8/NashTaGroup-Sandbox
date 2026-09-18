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
	type Category,
	deleteCategory as deleteCategoryApi,
} from "../../features/categories/api";
import CategoryDetailPanel from "../../features/categories/components/CategoryDetailPanel";
import CategoryFormModal from "../../features/categories/components/CategoryFormModal";
import CategoryOverview from "../../features/categories/components/CategoryOverview";
import CategoryTable from "../../features/categories/components/CategoryTable";
import {
	SORT_OPTIONS,
	STATUS_ITEMS,
	type SortBy,
	type StatusFilter,
} from "../../features/categories/format";
import { useCategoriesList } from "../../features/categories/hooks/useCategoriesList";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";

export default function CategoriesDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [page, setPage] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [formCategory, setFormCategory] = useState<Category | null>(null);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const pageSize = 8;

	const { flash, show, clear } = useFlash();

	const {
		categories,
		loading,
		error: fetchError,
		fetchCategories,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	} = useCategoriesList({
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
	} = useRowSelection(paged, categories.length);

	const selected = useSelectedItem(sorted, selectedId, sorted[0]);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	const handleCreate = useCallback(() => {
		setFormCategory(null);
		setShowForm(true);
	}, []);

	const handleEdit = useCallback(
		(category: Category) => {
			setSelectedId(category.id);
			setFormCategory(category);
			setShowForm(true);
		},
		[setSelectedId],
	);

	const handleAskDelete = useCallback(
		(category: Category) => {
			setSelectedId(category.id);
			setShowDelete(true);
		},
		[setSelectedId],
	);

	const handleDelete = async () => {
		if (!selected) return;
		setDeleting(true);
		try {
			await deleteCategoryApi(selected.id);
			show("Category berhasil dihapus");
			setShowDelete(false);
			await fetchCategories();
		} catch (error) {
			show(
				error instanceof Error ? error.message : "Gagal menghapus category",
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
					onRetry={fetchCategories}
				/>
			)}

			<CategoryOverview
				stats={stats}
				loading={loading}
			/>

			<Section title="Categories">
				<ListToolbar
					filters={
						<>
							<Input
								size="sm"
								placeholder="Search categories..."
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
								className="w-full sm:max-w-[228px]"
								aria-label="Search categories"
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
								label="Sort categories"
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
								Add Category
							</Button>
						</>
					}
				/>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
					<CategoryTable
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
						totalLabel={`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : sorted.length} categories`}
					/>
					<CategoryDetailPanel
						category={selected}
						onEdit={() => {
							setFormCategory(selected ?? null);
							setShowForm(true);
						}}
						onDelete={() => setShowDelete(true)}
					/>
				</div>
			</Section>

			<CategoryFormModal
				open={showForm}
				onOpenChange={setShowForm}
				category={formCategory}
				onSuccess={() => {
					show("Category berhasil disimpan");
					fetchCategories();
				}}
			/>

			<ConfirmModal
				open={showDelete}
				onOpenChange={setShowDelete}
				title="Delete category"
				description={
					selected
						? `Hapus "${selected.name}"? Tindakan ini soft delete.`
						: undefined
				}
				body="Category akan dihapus (soft delete) dan tidak muncul di daftar."
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
