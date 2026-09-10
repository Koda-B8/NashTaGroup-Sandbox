import { useCallback, useEffect, useMemo, useState } from "react";

import type { ApiMeta } from "../types/pagination";

function getPageCount(totalItems: number, pageSize: number): number {
	return Math.max(1, Math.ceil(totalItems / pageSize));
}

function getSafePage(page: number, pageCount: number): number {
	return Math.min(Math.max(0, page), pageCount - 1);
}

function paginateItems<T>(items: T[], safePage: number, pageSize: number): T[] {
	return items.slice(safePage * pageSize, safePage * pageSize + pageSize);
}

function isServerPaginatedMeta(
	meta: ApiMeta | null | undefined,
	itemsLength: number,
): boolean {
	return Boolean(meta && meta.pagination.total_items !== itemsLength);
}

export function useServerPagination(meta?: ApiMeta) {
	const pagination = meta?.pagination;
	const page = pagination ? pagination.page - 1 : 0;
	const limit = pagination?.limit ?? 20;
	const totalItems = pagination?.total_items ?? 0;
	const totalPages = pagination?.total_pages ?? 1;
	const safePage = getSafePage(page, totalPages);
	return {
		page: safePage,
		limit,
		totalItems,
		totalPages,
		rawPage: pagination?.page ?? 1,
	};
}

export type PaginatedFetcher<
	T,
	P extends Record<string, unknown> = Record<string, unknown>,
> = (
	params: P & { page?: number; limit?: number },
) => Promise<{ data: T[]; meta: ApiMeta }>;

export function usePaginatedList<T, P extends Record<string, unknown>>(opts: {
	fetcher: PaginatedFetcher<T, P>;
	params: P;
	page: number;
	pageSize: number;
	clientFilter?: (items: T[]) => T[];
	transform?: (items: T[]) => T[];
}) {
	const { fetcher, params, page, pageSize, clientFilter, transform } = opts;
	const [items, setItems] = useState<T[]>([]);
	const [meta, setMeta] = useState<ApiMeta | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const paramsKey = JSON.stringify(params);

	const fetchList = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const parsedParams = JSON.parse(paramsKey) as P;
			const { data, meta: m } = await fetcher({
				...parsedParams,
				page: page + 1,
				limit: pageSize,
			});
			setItems(data);
			setMeta(m);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Terjadi kesalahan jaringan",
			);
		} finally {
			setLoading(false);
		}
	}, [fetcher, paramsKey, page, pageSize]);

	useEffect(() => {
		queueMicrotask(() => void fetchList());
	}, [fetchList]);

	const server = useServerPagination(meta ?? undefined);
	const isServerPaginated = isServerPaginatedMeta(meta, items.length);

	const filteredBase = useMemo(() => {
		if (isServerPaginated || !clientFilter) return items;
		return clientFilter(items);
	}, [items, isServerPaginated, clientFilter]);

	const filtered = useMemo(() => {
		if (!transform) return filteredBase;
		return transform(filteredBase);
	}, [filteredBase, transform]);

	const pageCount = isServerPaginated
		? server.totalPages
		: getPageCount(filtered.length, pageSize);
	const safePage = isServerPaginated
		? server.page
		: getSafePage(page, pageCount);
	const paged = useMemo(() => {
		if (isServerPaginated) return filtered;
		return paginateItems(filtered, safePage, pageSize);
	}, [filtered, safePage, isServerPaginated, pageSize]);

	const totalItems = isServerPaginated ? server.totalItems : filtered.length;

	return {
		items,
		meta,
		loading,
		error,
		fetchList,
		server,
		isServerPaginated,
		filtered,
		paged,
		pageCount,
		safePage,
		totalItems,
	};
}
