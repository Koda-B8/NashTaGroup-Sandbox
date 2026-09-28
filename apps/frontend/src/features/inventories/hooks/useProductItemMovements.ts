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
	type MovementTypeFilter,
} from "../format";

interface ProductItemMovementParams {
	product_item_id: string;
	type?: MovementType;
	from?: string;
	to?: string;
}

export function useProductItemMovements(params: {
	productItemId: string;
	typeFilter: MovementTypeFilter;
	fromMonth: string;
	toMonth: string;
	page: number;
	pageSize: number;
}) {
	const { productItemId, typeFilter, fromMonth, toMonth, page, pageSize } =
		params;

	const {
		items: movements,
		loading,
		error,
		fetchList: fetchMovements,
		server,
		isServerPaginated,
		paged,
		pageCount,
		safePage,
		totalItems,
	} = usePaginatedList<InventoryMovement, ProductItemMovementParams>({
		fetcher: listInventoryMovements,
		params: {
			product_item_id: productItemId,
			type: movementTypeFilterToParam(typeFilter),
			from: monthStart(fromMonth),
			to: monthEnd(toMonth),
		},
		page,
		pageSize,
	});

	return {
		movements,
		loading,
		error,
		fetchMovements,
		server,
		isServerPaginated,
		paged,
		pageCount,
		safePage,
		totalItems,
	};
}
