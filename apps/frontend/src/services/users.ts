import { apiFetch } from "../lib/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../types/pagination";

export interface User {
	id: string;
	fullname: string;
	username: string;
	role?: string | { id: string; name: string };
	role_id?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt?: string;
}

export interface CreateUserPayload {
	fullname: string;
	username: string;
	password: string;
	role: "admin" | "cashier";
	isActive: boolean;
}

export interface ListUsersParams {
	search?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
}

export interface ListUsersResult {
	data: User[];
	meta: ApiMeta;
}

export async function listUsers(
	params: ListUsersParams = {},
): Promise<ListUsersResult> {
	const qs = new URLSearchParams();
	if (params.search) qs.set("search", params.search);
	if (params.isActive !== undefined)
		qs.set("isActive", String(params.isActive));
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/users${suffix}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<User> & { data?: unknown };
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat users (${res.status})`,
		);
	const data: User[] = Array.isArray(json?.data)
		? (json.data as User[])
		: Array.isArray(json)
			? (json as unknown as User[])
			: [];
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}

export async function createUser(
	payload: CreateUserPayload,
): Promise<{ message?: string }> {
	const res = await apiFetch("/api/v1/users", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok)
		throw new Error(data?.message ?? `Gagal membuat user (${res.status})`);
	return data;
}
