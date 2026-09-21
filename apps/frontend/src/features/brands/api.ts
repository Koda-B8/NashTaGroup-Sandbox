import { apiFetch } from "../../libs/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../../types/pagination";

export interface Brand {
	id: string;
	name: string;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface ListBrandsParams {
	search?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
}

export interface ListBrandsResult {
	data: Brand[];
	meta: ApiMeta;
}

export async function listBrands(
	params: ListBrandsParams = {},
): Promise<ListBrandsResult> {
	const qs = new URLSearchParams();
	if (params.search) qs.set("search", params.search);
	if (params.isActive !== undefined)
		qs.set("isActive", String(params.isActive));
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const res = await apiFetch(`/api/v1/brands${qs.toString() ? `?${qs}` : ""}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<Brand> & { data?: unknown };
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat brands (${res.status})`,
		);
	const data: Brand[] = Array.isArray(json?.data)
		? (json.data as Brand[])
		: Array.isArray(json)
			? (json as unknown as Brand[])
			: [];
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}
