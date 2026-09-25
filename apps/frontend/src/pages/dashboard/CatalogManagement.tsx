import { Plus } from "lucide-react";
import { type ComponentType, useCallback, useEffect, useState } from "react";

import Button from "../../components/ui/button";
import { DetailLayout } from "../../components/ui/detail-panel";
import ErrorBanner from "../../components/ui/error-banner";
import FilterPills from "../../components/ui/filter-pills";
import ListToolbar, {
	ListSearch,
	ListSort,
} from "../../components/ui/list-toolbar";
import { ConfirmModal } from "../../components/ui/modal";
import Section from "../../components/ui/section";
import Toast from "../../components/ui/toast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useFlash } from "../../hooks/useFlash";
import { useRowSelection, useSelectedItem } from "../../hooks/useRowSelection";
import {
	SORT_OPTIONS,
	STATUS_ITEMS,
	type SortBy,
	type StatusFilter,
} from "../../libs/catalog";

interface CatalogItem {
	id: string;
	name: string;
}

export interface CatalogList<T, S> {
	items: T[];
	loading: boolean;
	error: string | null;
	refetch: () => unknown;
	server: { totalItems: number };
	isServerPaginated: boolean;
	sorted: T[];
	paged: T[];
	pageCount: number;
	safePage: number;
	stats: S;
}

export interface CatalogTableProps<T> {
	loading: boolean;
	paged: T[];
	selectedId: string | undefined;
	selectedIds: Set<string>;
	allPageSelected: boolean;
	somePageSelected: boolean;
	onSelect: (id: string) => void;
	onEdit: (item: T) => void;
	onDelete: (item: T) => void;
	onToggleAll: (checked: boolean) => void;
	onToggleOne: (id: string, checked: boolean) => void;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	totalLabel: string;
}

export interface CatalogConfig<T extends CatalogItem, S> {
	noun: string;
	title: string;
	useList: (params: {
		debouncedSearch: string;
		statusFilter: StatusFilter;
		sortBy: SortBy;
		page: number;
		pageSize: number;
	}) => CatalogList<T, S>;
	remove: (id: string) => Promise<unknown>;
	Overview: ComponentType<{ stats: S; loading: boolean }>;
	Table: ComponentType<CatalogTableProps<T>>;
	Detail: ComponentType<{
		item: T | undefined;
		onEdit: () => void;
		onDelete: () => void;
	}>;
	Form: ComponentType<{
		open: boolean;
		onOpenChange: (open: boolean) => void;
		item: T | null;
		onSuccess: () => void;
	}>;
}

export default function CatalogDashboard<T extends CatalogItem, S>({
	noun,
	title,
	useList,
	remove,
	Overview,
	Table,
	Detail,
	Form,
}: CatalogConfig<T, S>) {
	const lowerNoun = noun.toLowerCase();
	const lowerTitle = title.toLowerCase();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [page, setPage] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [formItem, setFormItem] = useState<T | null>(null);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const pageSize = 8;

	const { flash, show, clear } = useFlash();

	const {
		items,
		loading,
		error: fetchError,
		refetch,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	} = useList({
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
	} = useRowSelection(paged, items.length);

	const selected = useSelectedItem(sorted, selectedId, sorted[0]);

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	const handleCreate = useCallback(() => {
		setFormItem(null);
		setShowForm(true);
	}, []);

	const handleEdit = useCallback(
		(item: T) => {
			setSelectedId(item.id);
			setFormItem(item);
			setShowForm(true);
		},
		[setSelectedId],
	);

	const handleAskDelete = useCallback(
		(item: T) => {
			setSelectedId(item.id);
			setShowDelete(true);
		},
		[setSelectedId],
	);

	const handleDelete = async () => {
		if (!selected) return;
		setDeleting(true);
		try {
			await remove(selected.id);
			show(`${noun} berhasil dihapus`);
			setShowDelete(false);
			await refetch();
		} catch (error) {
			show(
				error instanceof Error ? error.message : `Gagal menghapus ${lowerNoun}`,
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
					onRetry={refetch}
				/>
			)}

			<Overview
				stats={stats}
				loading={loading}
			/>

			<Section title={title}>
				<ListToolbar
					filters={
						<>
							<ListSearch
								placeholder={`Search ${lowerTitle}...`}
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
								aria-label={`Search ${lowerTitle}`}
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
							<ListSort
								label={`Sort this page of ${lowerTitle}`}
								value={sortBy}
								onValueChange={(v) => setSortBy(v as SortBy)}
								items={SORT_OPTIONS}
							/>
							<Button
								size="sm"
								onClick={handleCreate}
							>
								<Plus size={14} />
								Add {noun}
							</Button>
						</>
					}
				/>

				<DetailLayout>
					<Table
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
						totalLabel={`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : sorted.length} ${lowerTitle}`}
					/>
					<Detail
						item={selected}
						onEdit={() => {
							setFormItem(selected ?? null);
							setShowForm(true);
						}}
						onDelete={() => setShowDelete(true)}
					/>
				</DetailLayout>
			</Section>

			<Form
				open={showForm}
				onOpenChange={setShowForm}
				item={formItem}
				onSuccess={() => {
					show(`${noun} berhasil disimpan`);
					refetch();
				}}
			/>

			<ConfirmModal
				open={showDelete}
				onOpenChange={setShowDelete}
				title={`Delete ${lowerNoun}`}
				description={
					selected
						? `Hapus "${selected.name}"? Tindakan ini soft delete.`
						: undefined
				}
				body={`${noun} akan dihapus (soft delete) dan tidak muncul di daftar.`}
				loading={deleting}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
