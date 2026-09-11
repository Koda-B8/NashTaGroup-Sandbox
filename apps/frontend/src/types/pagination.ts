export interface PaginationMeta {
	page: number;
	limit: number;
	total_items: number;
	total_pages: number;
}

export interface ApiMeta {
	pagination: PaginationMeta;
}

export interface PaginatedResponse<T> {
	success: boolean;
	message?: string;
	data: T[];
	meta?: ApiMeta;
}

export function getPaginationMeta(
	fallbackTotal: number,
	limit: number,
	page: number,
): ApiMeta {
	const total_pages = Math.max(1, Math.ceil(fallbackTotal / limit));
	return {
		pagination: { page, limit, total_items: fallbackTotal, total_pages },
	};
}
