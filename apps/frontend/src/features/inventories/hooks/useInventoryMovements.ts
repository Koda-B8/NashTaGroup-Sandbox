import { useCallback } from "react";

import { usePaginatedList } from "../../../hooks/usePagination";
import {
	type InventoryMovement,
	listInventoryMovements,
	type MovementType,
} from "../api";
import {
	monthEnd,
	monthStart,
	movementTypeFilterToParam,
	sortMovements,
	type MovementSortBy,
	type MovementTypeFilter,
} from "../format";

interface MovementListParams {
	q?: string;
	type?: MovementType;
	from?: string;
	to?: string;
}

export function useInventoryMovements(params: {
	debouncedSearch: string;
	typeFilter: MovementTypeFilter;
	fromMonth: string;
	toMonth: string;
	sortBy: MovementSortBy;
	page: number;
	pageSize: number;
}) {
	const {
		debouncedSearch,
		typeFilter,
		fromMonth,
		toMonth,
		sortBy,
		page,
		pageSize,
	} = params;

	const transform = useCallback(
		(items: InventoryMovement[]) => sortMovements(items, sortBy),
		[sortBy],
	);

	const {
		items: movements,
		meta,
		loading,
		error,
		fetchList: fetchMovements,
		server,
		isServerPaginated,
		filtered: sorted,
		paged,
		pageCount,
		safePage,
	} = usePaginatedList<InventoryMovement, MovementListParams>({
		fetcher: listInventoryMovements,
		params: {
			q: debouncedSearch || undefined,
			type: movementTypeFilterToParam(typeFilter),
			from: monthStart(fromMonth),
			to: monthEnd(toMonth),
		},
		page,
		pageSize,
		transform,
	});

	return {
		movements,
		meta,
		loading,
		error,
		fetchMovements,
		server,
		isServerPaginated,
		sorted,
		paged,
		pageCount,
		safePage,
	};
}
