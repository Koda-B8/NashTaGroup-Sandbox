import { useCallback, useEffect, useMemo, useState } from "react";

interface Identified {
	id: string;
}

interface RowSelectionOptions {
	autoSelectFirstRow?: boolean;
}

export function useRowSelection<T extends Identified>(
	pageItems: T[],
	totalCount: number,
	options: RowSelectionOptions = {},
) {
	const { autoSelectFirstRow = false } = options;
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		queueMicrotask(() => {
			if (pageItems.length > 0) {
				const first = pageItems[0]!.id;
				setSelectedId((prev) =>
					prev && pageItems.some((item) => item.id === prev) ? prev : first,
				);
				if (autoSelectFirstRow) {
					setSelectedIds((prev) => (prev.size > 0 ? prev : new Set([first])));
				}
			} else if (totalCount === 0) {
				setSelectedId(null);
			}
		});
	}, [pageItems, totalCount, autoSelectFirstRow]);

	const allPageSelected =
		pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id));
	const somePageSelected =
		pageItems.some((item) => selectedIds.has(item.id)) && !allPageSelected;

	const toggleAllPage = useCallback(
		(checked: boolean) =>
			setSelectedIds((prev) => {
				const next = new Set(prev);
				for (const item of pageItems) {
					if (checked) next.add(item.id);
					else next.delete(item.id);
				}
				return next;
			}),
		[pageItems],
	);

	const toggleOne = useCallback((id: string, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	}, []);

	return {
		selectedId,
		setSelectedId,
		selectedIds,
		allPageSelected,
		somePageSelected,
		toggleAllPage,
		toggleOne,
	};
}

export function useSelectedItem<
	T extends Identified,
	F extends T | null | undefined,
>(pool: T[], selectedId: string | null | undefined, fallback: F): T | F {
	return useMemo(() => {
		if (!selectedId) return fallback;
		return pool.find((item) => item.id === selectedId) ?? fallback;
	}, [pool, selectedId, fallback]);
}
