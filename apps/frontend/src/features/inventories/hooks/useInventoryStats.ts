import { useCallback, useEffect, useState } from "react";

import { listInventories } from "../api";

export interface InventoryStats {
	total: number;
	available: number;
	low: number;
	outOfStock: number;
}

const EMPTY_STATS: InventoryStats = {
	total: 0,
	available: 0,
	low: 0,
	outOfStock: 0,
};

export function useInventoryStats() {
	const [stats, setStats] = useState<InventoryStats>(EMPTY_STATS);
	const [loading, setLoading] = useState(true);

	const loadStats = useCallback(async () => {
		setLoading(true);
		try {
			const settled = await Promise.allSettled([
				listInventories({ limit: 1 }),
				listInventories({ limit: 1, stock_status: "available" }),
				listInventories({ limit: 1, stock_status: "low" }),
				listInventories({ limit: 1, stock_status: "out_of_stock" }),
			]);
			const count = (index: number) => {
				const entry = settled[index];
				if (!entry || entry.status !== "fulfilled") return 0;
				return entry.value.meta.pagination.total_items;
			};
			setStats({
				total: count(0),
				available: count(1),
				low: count(2),
				outOfStock: count(3),
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		queueMicrotask(() => void loadStats());
	}, [loadStats]);

	return { stats, loading, reloadStats: loadStats };
}
