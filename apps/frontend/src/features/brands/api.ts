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

export async function createBrand(payload: { name: string }): Promise<void> {
	const res = await apiFetch("/api/v1/brands", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(
			data?.message ??
				(res.status === 409
					? "Nama brand sudah ada"
					: res.status === 403
						? "Hanya admin yang dapat membuat brand"
						: `Gagal membuat brand (${res.status})`),
		);
	}
}

export async function updateBrand(
	id: string,
	payload: { name?: string; is_active?: boolean },
): Promise<void> {
	const res = await apiFetch(`/api/v1/brands/${id}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(
			data?.message ??
				(res.status === 409
					? "Nama brand sudah ada"
					: res.status === 404
						? "Brand tidak ditemukan"
						: `Gagal memperbarui brand (${res.status})`),
		);
	}
}

export async function deleteBrand(id: string): Promise<void> {
	const res = await apiFetch(`/api/v1/brands/${id}`, { method: "DELETE" });
	const data = await res.json().catch(() => ({}));
	if (!res.ok)
		throw new Error(
			data?.message ??
				(res.status === 409
					? "Brand sedang dipakai oleh produk"
					: `Gagal menghapus brand (${res.status})`),
		);
}
