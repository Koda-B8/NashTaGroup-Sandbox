import { useCallback, useEffect, useMemo, useState } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listBrands, type Brand } from "../api";
import {
	buildBrandStats,
	sortBrands,
	type BrandStats as BrandStatsOf,
	type SortBy,
	type StatusFilter,
} from "../format";

export type BrandStats = BrandStatsOf<Brand>;

export function useBrandsList(params: {
	debouncedSearch: string;
	statusFilter: StatusFilter;
	sortBy: SortBy;
	page: number;
	pageSize: number;
}) {
	const { debouncedSearch, statusFilter, sortBy, page, pageSize } = params;

	const transform = useCallback(
		(items: Brand[]) => sortBrands(items, sortBy),
		[sortBy],
	);

	const {
		items: brands,
		meta,
		loading,
		error,
		fetchList: fetchBrands,
		server,
		isServerPaginated,
		filtered: sorted,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<Brand, { search?: string; isActive?: boolean }>({
		fetcher: listBrands,
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
					listBrands({ search, limit: 1 }),
					listBrands({ search, isActive: true, limit: 1 }),
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

	const stats = useMemo<BrandStats>(
		() => buildBrandStats(brands, counts),
		[brands, counts],
	);

	return {
		brands,
		meta,
		loading,
		error,
		fetchBrands,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		stats,
	};
}
