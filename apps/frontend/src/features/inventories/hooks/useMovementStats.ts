import { useCallback, useEffect, useState } from "react";

import { listInventoryMovements } from "../api";

export interface MovementStats {
	total: number;
	additions: number;
	reductions: number;
	corrections: number;
}

const EMPTY_STATS: MovementStats = {
	total: 0,
	additions: 0,
	reductions: 0,
	corrections: 0,
};

export function useMovementStats() {
	const [stats, setStats] = useState<MovementStats>(EMPTY_STATS);
	const [loading, setLoading] = useState(true);

	const loadStats = useCallback(async () => {
		setLoading(true);
		try {
			const settled = await Promise.allSettled([
				listInventoryMovements({ limit: 1 }),
				listInventoryMovements({ limit: 1, type: "addition" }),
				listInventoryMovements({ limit: 1, type: "reduction" }),
				listInventoryMovements({ limit: 1, type: "correction" }),
			]);
			const count = (index: number) => {
				const entry = settled[index];
				if (!entry || entry.status !== "fulfilled") return 0;
				return entry.value.meta.pagination.total_items;
			};
			setStats({
				total: count(0),
				additions: count(1),
				reductions: count(2),
				corrections: count(3),
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
