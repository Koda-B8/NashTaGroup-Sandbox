import { useCallback, useEffect, useMemo, useState } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listCategories, type Category } from "../api";
import {
	buildCategoryStats,
	sortCategories,
	type CategoryStats as CategoryStatsOf,
	type SortBy,
	type StatusFilter,
} from "../format";

export type CategoryStats = CategoryStatsOf<Category>;

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

	// ponytail: two limit=1 requests just to read total_items; replace with a
	// server-side stats endpoint if the extra round trips start to matter
	const [counts, setCounts] = useState<{
		total: number;
		active: number;
	} | null>(null);

	useEffect(() => {
		let cancelled = false;
		const search = debouncedSearch || undefined;
		const loadCounts = async () => {
			try {
				const [all, activeOnly] = await Promise.all([
					listCategories({ search, limit: 1 }),
					listCategories({ search, isActive: true, limit: 1 }),
				]);
				if (!cancelled)
					setCounts({
						total: all.meta.pagination.total_items,
						active: activeOnly.meta.pagination.total_items,
					});
			} catch {
				if (!cancelled) setCounts(null);
			}
		};
		void loadCounts();
		return () => {
			cancelled = true;
		};
	}, [debouncedSearch, meta]);

	const stats = useMemo<CategoryStats>(
		() => buildCategoryStats(categories, counts),
		[categories, counts],
	);

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
