import { apiFetch } from "../../libs/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../../types/pagination";

export interface Customer {
	id: string;
	name: string;
	phone: string;
	createdAt: string;
}

type RawCustomer = Omit<Customer, "createdAt"> & {
	created_at?: string;
	createdAt?: string;
};

export interface ListCustomersParams {
	search?: string;
	page?: number;
	limit?: number;
}

export interface ListCustomersResult {
	data: Customer[];
	meta: ApiMeta;
}

export async function listCustomers(
	params: ListCustomersParams = {},
): Promise<ListCustomersResult> {
	const qs = new URLSearchParams();
	if (params.search) qs.set("q", params.search);
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/customers${suffix}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<Customer> & { data?: unknown };
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat customers (${res.status})`,
		);
	const raw: RawCustomer[] = Array.isArray(json?.data)
		? (json.data as RawCustomer[])
		: Array.isArray(json)
			? (json as unknown as RawCustomer[])
			: [];
	const data: Customer[] = raw.map(({ created_at, ...customer }) => ({
		...customer,
		createdAt: created_at ?? customer.createdAt ?? "",
	}));
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}
