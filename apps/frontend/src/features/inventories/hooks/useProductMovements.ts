import { useCallback, useEffect, useMemo, useState } from "react";

import type { InventoryMovement } from "../api";
import {
	monthEnd,
	monthStart,
	movementTypeFilterToParam,
	type MovementTypeFilter,
} from "../format";
import { fetchAllInventoryMovements } from "../loadMovements";

/**
 * Product-master movement history: loads every variant's movements, merges
 * them, and paginates on the client because the API filters per product item.
 */
export function useProductMovements(params: {
	productItemIds: string[];
	typeFilter: MovementTypeFilter;
	fromMonth: string;
	toMonth: string;
	page: number;
	pageSize: number;
}) {
	const { productItemIds, typeFilter, fromMonth, toMonth, page, pageSize } =
		params;
	const idsKey = productItemIds.join(",");

	const [movements, setMovements] = useState<InventoryMovement[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	const fetchMovements = useCallback(
		() => setReloadToken((token) => token + 1),
		[],
	);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchAllInventoryMovements({
					productItemIds: idsKey ? idsKey.split(",") : [],
					type: movementTypeFilterToParam(typeFilter),
					from: monthStart(fromMonth),
					to: monthEnd(toMonth),
				});
				if (!cancelled) setMovements(data);
			} catch (fetchError) {
				if (!cancelled)
					setError(
						fetchError instanceof Error
							? fetchError.message
							: "Terjadi kesalahan jaringan",
					);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		queueMicrotask(() => void run());
		return () => {
			cancelled = true;
		};
	}, [idsKey, typeFilter, fromMonth, toMonth, reloadToken]);

	const totalItems = movements.length;
	const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
	const safePage = Math.min(Math.max(0, page), pageCount - 1);
	const paged = useMemo(
		() => movements.slice(safePage * pageSize, safePage * pageSize + pageSize),
		[movements, safePage, pageSize],
	);

	return {
		movements,
		loading,
		error,
		fetchMovements,
		paged,
		pageCount,
		safePage,
		totalItems,
	};
}
