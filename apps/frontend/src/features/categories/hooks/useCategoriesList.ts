import { useCallback, useMemo } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listCategories, type Category } from "../api";
import { sortCategories, type SortBy, type StatusFilter } from "../format";

export interface CategoryStats {
	total: number;
	active: number;
	inactive: number;
	best: Category | null;
	activeRate: number;
}

export function useCategoriesList(params: {
	debouncedSearch: string;
	statusFilter: StatusFilter;
	sortBy: SortBy;
	page: number;
	pageSize: number;
}) {
	const { debouncedSearch, statusFilter, sortBy, page, pageSize } = params;

	const transform = useCallback(
		(items: Category[]) => sortCategories(items, sortBy),
		[sortBy],
	);

	const {
		items: categories,
		meta,
		loading,
		error,
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
		transform,
	});

	const stats = useMemo<CategoryStats>(() => {
		const total = meta?.pagination.total_items ?? categories.length;
		const active = categories.filter((c) => c.isActive).length;
		const inactive = meta ? total - active : categories.length - active;
		const best =
			[...categories].sort((a, b) =>
				b.updatedAt.localeCompare(a.updatedAt),
			)[0] ?? null;
		const activeRate = total ? Math.round((active / total) * 100) : 0;
		return { total, active, inactive, best, activeRate };
	}, [categories, meta]);

	return {
		categories,
		meta,
		loading,
		error,
		fetchCategories,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	};
}
