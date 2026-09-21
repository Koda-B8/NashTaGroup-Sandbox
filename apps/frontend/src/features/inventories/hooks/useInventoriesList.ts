import { useCallback } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import { listInventories, type InventoryItem, type StockStatus } from "../api";
import {
	sortInventories,
	stockStatusFilterToParam,
	type SortBy,
	type StockStatusFilter,
} from "../format";
import { useInventoryFilterOptions } from "./useInventoryFilterOptions";

interface InventoryListParams {
	q?: string;
	category_id?: string;
	brand_id?: string;
	stock_status?: StockStatus;
}

export function useInventoriesList(params: {
	debouncedSearch: string;
	statusFilter: StockStatusFilter;
	categoryId: string;
	brandId: string;
	sortBy: SortBy;
	page: number;
	pageSize: number;
}) {
	const {
		debouncedSearch,
		statusFilter,
		categoryId,
		brandId,
		sortBy,
		page,
		pageSize,
	} = params;

	const transform = useCallback(
		(items: InventoryItem[]) => sortInventories(items, sortBy),
		[sortBy],
	);

	const {
		items: inventories,
		meta,
		loading,
		error,
		fetchList: fetchInventories,
		server,
		isServerPaginated,
		filtered: sorted,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<InventoryItem, InventoryListParams>({
		fetcher: listInventories,
		params: {
			q: debouncedSearch || undefined,
			category_id: categoryId || undefined,
			brand_id: brandId || undefined,
			stock_status: stockStatusFilterToParam(statusFilter),
		},
		page,
		pageSize,
		transform,
	});

	const {
		categoryOptions,
		brandOptions,
		loading: optionsLoading,
	} = useInventoryFilterOptions();

	return {
		inventories,
		meta,
		loading,
		error,
		fetchInventories,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
		categoryOptions,
		brandOptions,
		optionsLoading,
	};
}
