import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PaginationControls from "../../components/dashboard/shared/PaginationControls";
import ActionMenu from "../../components/ui/action-menu";
import Badge from "../../components/ui/badge";
import Button from "../../components/ui/button";
import Card from "../../components/ui/card";
import Checkbox from "../../components/ui/checkbox";
import FilterPills from "../../components/ui/filter-pills";
import Input from "../../components/ui/input";
import Modal, { ModalBody, ModalFooter } from "../../components/ui/modal";
import Select from "../../components/ui/select";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { usePaginatedList } from "../../hooks/usePagination";
import { dotColor, formatDate, initials } from "../../libs/format";
import {
	type Category,
	createCategory,
	deleteCategory as deleteCategoryApi,
	listCategories,
	updateCategory,
} from "../../services/categories";

type StatusFilter = "All" | "Active" | "Inactive";
type SortBy = "name_asc" | "name_desc" | "updated_desc" | "created_desc";

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
	{ label: "Name A–Z", value: "name_asc" },
	{ label: "Name Z–A", value: "name_desc" },
	{ label: "Last Updated", value: "updated_desc" },
	{ label: "Created", value: "created_desc" },
];

function CreateCategoryModal({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onSuccess: () => void;
}) {
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const reset = useCallback(() => {
		setName("");
		setError(null);
		setServerError(null);
	}, []);
	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) reset();
			onOpenChange(next);
		},
		[onOpenChange, reset],
	);
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError(null);
		const trimmed = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmed) {
			setError("Nama category wajib diisi");
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			await createCategory({ name: trimmed });
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
			title="Add Category"
			description="Buat category baru. Nama wajib diisi."
			size="lg"
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
							htmlFor="cat-name-create"
							className="text-xs font-medium text-text-h"
						>
							Name <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="cat-name-create"
							placeholder="Gaming"
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							invalid={Boolean(error)}
							autoComplete="off"
						/>
						{error ? (
							<span className="text-[11px] text-deep-danger">{error}</span>
						) : (
							<span className="text-[11px] text-text">
								Maks 100 karakter, unik
							</span>
						)}
					</div>
				</ModalBody>
				<ModalFooter className="mt-4 -mx-5 -mb-4">
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
						{submitting ? "Creating..." : "Create"}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}

function EditCategoryModal({
	open,
	onOpenChange,
	category,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	category: Category | null;
	onSuccess: () => void;
}) {
	const [name, setName] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	useEffect(() => {
		queueMicrotask(() => {
			if (open && category) {
				setName(category.name);
				setIsActive(category.isActive);
				setError(null);
				setServerError(null);
			}
		});
	}, [open, category]);
	const handleOpen = useCallback(
		(next: boolean) => {
			if (!next) {
				setError(null);
				setServerError(null);
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!category) return;
		setServerError(null);
		const trimmed = name.trim().replaceAll(/\s+/g, " ");
		if (!trimmed) {
			setError("Nama category tidak boleh kosong");
			return;
		}
		if (trimmed === category.name && isActive === category.isActive) {
			setServerError("Tidak ada perubahan");
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			const payload: Record<string, unknown> = {};
			if (trimmed !== category.name) payload.name = trimmed;
			if (isActive !== category.isActive) payload.isActive = isActive;
			await updateCategory(
				category.id,
				payload as { name?: string; isActive?: boolean },
			);
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
			title="Edit Category"
			description={category ? `Perbarui "${category.name}"` : undefined}
			size="lg"
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
							htmlFor="cat-name-edit"
							className="text-xs font-medium text-text-h"
						>
							Name <span className="text-deep-danger">*</span>
						</label>
						<Input
							id="cat-name-edit"
							placeholder="Gaming Accessories"
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							invalid={Boolean(error)}
							autoComplete="off"
						/>
						{error && (
							<span className="text-[11px] text-deep-danger">{error}</span>
						)}
					</div>
					<label
						htmlFor="cat-isActive-edit"
						className="flex items-center gap-2 py-1 text-sm text-text-h select-none"
					>
						<Checkbox
							id="cat-isActive-edit"
							checked={isActive}
							onCheckedChange={(c) => setIsActive(c === true)}
							aria-label="Active status"
						/>
						<span className="text-xs font-medium">Active</span>
						<span className="text-[11px] text-text">— isActive</span>
					</label>
				</ModalBody>
				<ModalFooter className="mt-4 -mx-5 -mb-4">
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
						{submitting ? "Saving..." : "Save"}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}

export default function CategoriesDashboard() {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 350);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [sortBy, setSortBy] = useState<SortBy>("name_asc");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [showCreate, setShowCreate] = useState(false);
	const [showEdit, setShowEdit] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [toastVariant, setToastVariant] = useState<"success" | "error">(
		"success",
	);
	const pageSize = 8;

	const sortTransform = useCallback(
		(items: Category[]) => {
			return [...items].sort((a, b) => {
				if (sortBy === "name_asc") return a.name.localeCompare(b.name);
				if (sortBy === "name_desc") return b.name.localeCompare(a.name);
				if (sortBy === "updated_desc")
					return b.updatedAt.localeCompare(a.updatedAt);
				if (sortBy === "created_desc")
					return b.createdAt.localeCompare(a.createdAt);
				return 0;
			});
		},
		[sortBy],
	);

	const {
		items: categories,
		meta,
		loading,
		error: fetchError,
		fetchList: fetchCategories,
		server,
		isServerPaginated,
		filtered: sorted,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<Category, { search?: string; isActive?: boolean }>({
		fetcher: listCategories,
		params: {
			search: debouncedSearch || undefined,
			isActive:
				statusFilter === "Active"
					? true
					: statusFilter === "Inactive"
						? false
						: undefined,
		},
		page,
		pageSize,
		transform: sortTransform,
	});

	useEffect(() => {
		queueMicrotask(() => setPage(0));
	}, [debouncedSearch, statusFilter]);

	useEffect(() => {
		queueMicrotask(() => {
			if (paged.length > 0)
				setSelectedId((prev) =>
					prev && paged.some((c) => c.id === prev) ? prev : paged[0]!.id,
				);
			else if (categories.length === 0) setSelectedId(null);
		});
	}, [paged, categories.length]);

	const flash = (msg: string, variant: "success" | "error" = "success") => {
		setToast(msg);
		setToastVariant(variant);
		setTimeout(() => setToast(null), 2800);
	};

	const stats = useMemo(() => {
		const total = meta?.pagination.total_items ?? categories.length;
		const active = categories.filter((c) => c.isActive).length;
		const inactive = meta ? total - active : categories.length - active;
		const best =
			[...categories].sort((a, b) =>
				b.updatedAt.localeCompare(a.updatedAt),
			)[0] ?? null;
		return { total, active, inactive, best };
	}, [categories, meta]);

	const selected = useMemo(() => {
		if (!selectedId) return sorted[0] ?? null;
		return sorted.find((c) => c.id === selectedId) ?? sorted[0] ?? null;
	}, [sorted, selectedId]);

	const allPageSelected =
		paged.length > 0 && paged.every((c) => selectedIds.has(c.id));
	const somePageSelected =
		paged.some((c) => selectedIds.has(c.id)) && !allPageSelected;
	const toggleAllPage = (checked: boolean) =>
		setSelectedIds((prev) => {
			const n = new Set(prev);
			if (checked) paged.forEach((c) => n.add(c.id));
			else paged.forEach((c) => n.delete(c.id));
			return n;
		});
	const toggleOne = (id: string, checked: boolean) =>
		setSelectedIds((prev) => {
			const n = new Set(prev);
			if (checked) n.add(id);
			else n.delete(id);
			return n;
		});

	const handleDelete = async () => {
		if (!selected) return;
		setDeleting(true);
		try {
			await deleteCategoryApi(selected.id);
			flash("Category berhasil dihapus");
			setShowDelete(false);
			await fetchCategories();
		} catch (error) {
			flash(
				error instanceof Error ? error.message : "Gagal menghapus category",
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
						onClick={fetchCategories}
						className="ml-2 font-semibold underline"
					>
						Coba lagi
					</button>
				</div>
			)}

			<section aria-labelledby="overview-heading">
				<h2
					id="overview-heading"
					className="mb-3 text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Overview
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<Card
						padding="md"
						className="flex flex-col gap-1"
					>
						<p className="text-2xl font-bold tracking-tight text-text-h">
							{loading ? "—" : stats.total}
						</p>
						<p className="text-xs font-medium text-text-h">Total Categories</p>
						<p className="text-[11px] text-text">{stats.active} active</p>
					</Card>
					<Card
						padding="md"
						className="flex flex-col gap-1"
					>
						<p className="text-2xl font-bold tracking-tight text-text-h">
							{loading ? "—" : stats.active}
						</p>
						<p className="text-xs font-medium text-text-h">Active</p>
						<p className="text-[11px] text-text">{stats.inactive} inactive</p>
					</Card>
					<Card
						padding="md"
						className="flex flex-col gap-1"
					>
						<p className="text-2xl font-bold tracking-tight text-text-h">
							{loading ? "—" : (stats.best?.name ?? "—")}
						</p>
						<p className="text-xs font-medium text-text-h">Best Category</p>
						<p className="text-[11px] text-text">
							{stats.best ? formatDate(stats.best.updatedAt) : "—"}
						</p>
					</Card>
					<Card
						padding="md"
						className="flex flex-col gap-1"
					>
						<p className="text-2xl font-bold tracking-tight text-text-h">
							{loading
								? "—"
								: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%`}
						</p>
						<p className="text-xs font-medium text-text-h">Active Rate</p>
						<p className="text-[11px] text-text">This month</p>
					</Card>
				</div>
			</section>

			<section
				aria-labelledby="categories-heading"
				className="flex flex-col gap-3"
			>
				<h2
					id="categories-heading"
					className="text-[11px] font-semibold tracking-wider text-text uppercase"
				>
					Categories
				</h2>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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
							items={[
								{ label: "All", value: "All" },
								{ label: "Active", value: "Active" },
								{ label: "Inactive", value: "Inactive" },
							]}
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as StatusFilter)}
						/>
					</div>
					<div className="flex items-center gap-2">
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
							onClick={() => setShowCreate(true)}
						>
							<Plus size={14} />
							Add Category
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
					<Card
						padding="none"
						className="overflow-hidden"
					>
						<div className="overflow-x-auto">
							<table
								className="w-full text-left text-sm"
								aria-label="Categories"
							>
								<thead className="border-b border-base-border bg-base">
									<tr>
										<th
											scope="col"
											className="w-10 px-3 py-3"
										>
											<Checkbox
												checked={allPageSelected}
												indeterminate={somePageSelected}
												onCheckedChange={(c) => toggleAllPage(c === true)}
												aria-label="Select all categories on this page"
											/>
										</th>
										<th
											scope="col"
											className="px-3 py-3 text-xs font-semibold text-text"
										>
											Name
										</th>
										<th
											scope="col"
											className="px-3 py-3 text-xs font-semibold text-text"
										>
											Status
										</th>
										<th
											scope="col"
											className="px-3 py-3 text-xs font-semibold text-text"
										>
											Created
										</th>
										<th
											scope="col"
											className="px-3 py-3 text-xs font-semibold text-text"
										>
											Last Updated
										</th>
										<th
											scope="col"
											className="w-10 px-3 py-3"
											aria-label="Actions"
										/>
									</tr>
								</thead>
								<tbody className="divide-y divide-base-border">
									{loading ? (
										<tr>
											<td
												colSpan={6}
												className="px-4 py-10 text-center text-sm text-text"
											>
												Memuat categories...
											</td>
										</tr>
									) : paged.length === 0 ? (
										<tr>
											<td
												colSpan={6}
												className="px-4 py-10 text-center text-sm text-text"
											>
												No categories found.
											</td>
										</tr>
									) : (
										paged.map((row) => {
											const isActiveRow = row.id === selected?.id;
											const dot = dotColor(row.name);
											return (
												<tr
													key={row.id}
													onClick={() => setSelectedId(row.id)}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															setSelectedId(row.id);
														}
													}}
													tabIndex={0}
													className={`cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${isActiveRow ? "bg-primary-light/50" : "hover:bg-base/60"}`}
												>
													<td
														className="px-3 py-3"
														onClick={(e) => e.stopPropagation()}
													>
														<Checkbox
															checked={selectedIds.has(row.id)}
															onCheckedChange={(c) =>
																toggleOne(row.id, c === true)
															}
															aria-label={`Select ${row.name}`}
														/>
													</td>
													<td className="px-3 py-3">
														<div className="flex items-center gap-2.5">
															<span
																className="size-2.5 shrink-0 rounded-full"
																style={{ backgroundColor: dot }}
																aria-hidden
															/>
															<span
																className={`text-sm font-medium ${isActiveRow ? "text-primary" : "text-text-h"}`}
															>
																{row.name}
															</span>
														</div>
													</td>
													<td className="px-3 py-3">
														<Badge
															variant={row.isActive ? "primary" : "neutral"}
															size="sm"
														>
															{row.isActive ? "Active" : "Inactive"}
														</Badge>
													</td>
													<td className="px-3 py-3 text-sm text-text">
														{formatDate(row.createdAt)}
													</td>
													<td className="px-3 py-3 text-sm text-text">
														{formatDate(row.updatedAt)}
													</td>
													<td
														className="px-3 py-3"
														onClick={(e) => e.stopPropagation()}
													>
														<ActionMenu
															label={`Actions for ${row.name}`}
															items={[
																{
																	label: "View detail",
																	onSelect: () => setSelectedId(row.id),
																},
																{
																	label: "Edit",
																	onSelect: () => {
																		setSelectedId(row.id);
																		setShowEdit(true);
																	},
																},
																{
																	label: "Delete",
																	onSelect: () => {
																		setSelectedId(row.id);
																		setShowDelete(true);
																	},
																	danger: true,
																},
															]}
														/>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
						<PaginationControls
							totalLabel={`Showing ${paged.length} of ${isServerPaginated ? server.totalItems : sorted.length} categories`}
							pageCount={pageCount}
							safePage={safePage}
							onPageChange={setPage}
						/>
					</Card>

					<Card
						padding="md"
						className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
					>
						{selected ? (
							<>
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<span
											className="size-2.5 rounded-full"
											style={{ backgroundColor: dotColor(selected.name) }}
											aria-hidden
										/>
										<p className="text-base font-bold text-text-h">
											{selected.name}
										</p>
									</div>
									<p
										className="truncate text-xs text-text"
										title={selected.id}
									>
										{selected.id}
									</p>
									<Badge
										variant={selected.isActive ? "primary" : "neutral"}
										size="sm"
										className="w-fit"
									>
										{selected.isActive ? "Active" : "Inactive"}
									</Badge>
								</div>
								<div className="border-t border-base-border" />
								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
										<p className="text-sm font-semibold text-text-h">
											{formatDate(selected.createdAt)}
										</p>
										<p className="text-[11px] text-text">Created</p>
									</div>
									<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
										<p className="text-sm font-semibold text-text-h">
											{formatDate(selected.updatedAt)}
										</p>
										<p className="text-[11px] text-text">Last Updated</p>
									</div>
									<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
										<p className="text-sm font-semibold text-text-h">
											{selected.isActive ? "Active" : "Inactive"}
										</p>
										<p className="text-[11px] text-text">Status</p>
									</div>
									<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
										<p className="text-sm font-semibold text-text-h">
											{selected.name.length} chars
										</p>
										<p className="text-[11px] text-text">Name length</p>
									</div>
								</div>
								<div className="border-t border-base-border" />
								<div className="flex items-center gap-2 rounded-lg border border-base-border bg-base px-3 py-2.5">
									<span
										className="flex size-8 items-center justify-center rounded-lg text-sm font-bold"
										style={{
											backgroundColor: `${dotColor(selected.name)}14`,
											color: dotColor(selected.name),
										}}
									>
										{initials(selected.name)}
									</span>
									<div className="min-w-0">
										<p className="truncate text-xs font-medium text-text-h">
											{selected.name}
										</p>
										<p className="text-[11px] text-text">
											{selected.isActive ? "Active" : "Inactive"} •{" "}
											{formatDate(selected.updatedAt)}
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button
										size="sm"
										onClick={() => setShowEdit(true)}
									>
										Edit
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowDelete(true)}
									>
										Delete
									</Button>
								</div>
							</>
						) : (
							<p className="py-10 text-center text-sm text-text">
								Pilih category untuk melihat detail.
							</p>
						)}
					</Card>
				</div>
			</section>

			<CreateCategoryModal
				open={showCreate}
				onOpenChange={setShowCreate}
				onSuccess={() => {
					flash("Category berhasil dibuat");
					fetchCategories();
				}}
			/>
			<EditCategoryModal
				open={showEdit}
				onOpenChange={setShowEdit}
				category={selected}
				onSuccess={() => {
					flash("Category berhasil diperbarui");
					fetchCategories();
				}}
			/>
			<Modal
				open={showDelete}
				onOpenChange={setShowDelete}
				title="Delete category"
				description={
					selected
						? `Hapus "${selected.name}"? Tindakan ini soft delete.`
						: undefined
				}
				size="sm"
			>
				<ModalBody>
					<p className="text-sm text-text">
						Category akan dihapus (soft delete) dan tidak muncul di daftar.
					</p>
				</ModalBody>
				<ModalFooter className="mt-4 -mx-5 -mb-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowDelete(false)}
						disabled={deleting}
					>
						Cancel
					</Button>
					<Button
						variant="danger"
						size="sm"
						onClick={handleDelete}
						disabled={deleting}
					>
						{deleting ? "Deleting..." : "Delete"}
					</Button>
				</ModalFooter>
			</Modal>
		</div>
	);
}
