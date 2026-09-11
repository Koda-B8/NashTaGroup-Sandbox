import { apiFetch } from "../libs/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../types/pagination";

export interface Category {
	id: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
}

export type CategoryStatusFilter = "All" | "Active" | "Inactive";

export interface ListCategoriesParams {
	search?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
}

export interface ListCategoriesResult {
	data: Category[];
	meta: ApiMeta;
}

export async function listCategories(
	params: ListCategoriesParams,
): Promise<ListCategoriesResult> {
	const qs = new URLSearchParams();
	if (params.search) qs.set("search", params.search);
	if (params.isActive !== undefined)
		qs.set("isActive", String(params.isActive));
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const res = await apiFetch(
		`/api/v1/categories${qs.toString() ? `?${qs}` : ""}`,
	);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<Category> & { data?: unknown };
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat categories (${res.status})`,
		);
	const data: Category[] = Array.isArray(json?.data)
		? (json.data as Category[])
		: (Array.isArray(json)
			? (json as unknown as Category[])
			: []);
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}

export async function createCategory(payload: { name: string }): Promise<void> {
	const res = await apiFetch("/api/v1/categories", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(
			data?.message ??
				(res.status === 409
					? "Nama category sudah ada"
					: (res.status === 403
						? "Hanya admin yang dapat membuat category"
						: `Gagal membuat category (${res.status})`)),
		);
	}
}

export async function updateCategory(
	id: string,
	payload: { name?: string; isActive?: boolean },
): Promise<void> {
	const res = await apiFetch(`/api/v1/categories/${id}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(
			data?.message ??
				(res.status === 409
					? "Nama category sudah ada"
					: (res.status === 404
						? "Category tidak ditemukan"
						: `Gagal memperbarui category (${res.status})`)),
		);
	}
}

export async function deleteCategory(id: string): Promise<void> {
	const res = await apiFetch(`/api/v1/categories/${id}`, { method: "DELETE" });
	const data = await res.json().catch(() => ({}));
	if (!res.ok)
		throw new Error(
			data?.message ?? `Gagal menghapus category (${res.status})`,
		);
}
