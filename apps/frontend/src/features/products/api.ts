import { apiFetch } from "../../libs/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../../types/pagination";

export interface ProductImage {
	alt: string;
	url: string;
}

export interface ProductItem {
	id: string;
	productId?: string;
	productCode?: string;
	name: string;
	price: number | string;
	stock: number;
	isActive?: boolean;
	image?: ProductImage | null;
	product?: ProductRef;
}

export interface ProductRef {
	id: string;
	name: string;
	isActive?: boolean;
}

export interface Product {
	id: string;
	name: string;
	description?: string | null;
	categoryId: string;
	brandId: string;
	category?: ProductRef;
	brand?: ProductRef;
	image?: ProductImage | null;
	stock: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	items: ProductItem[];
}

type ApiImagePayload =
	| string
	| { alt?: string | null; url?: string | null }
	| null
	| undefined;

type ApiProductItem = Omit<ProductItem, "image" | "stock"> & {
	image?: ApiImagePayload;
	alt?: string | null;
	stock?: number;
};

type ApiProduct = Omit<Product, "image" | "items" | "stock"> & {
	image?: ApiImagePayload;
	alt?: string | null;
	stock?: number;
	items?: ApiProductItem[];
};

const toProductImage = (
	image: ApiImagePayload,
	alt: string | null | undefined,
	fallbackAlt: string,
): ProductImage | undefined => {
	if (typeof image === "string") return { alt: alt ?? fallbackAlt, url: image };
	if (image?.url)
		return { alt: image.alt ?? alt ?? fallbackAlt, url: image.url };
};

const toProductItem = (item: ApiProductItem): ProductItem => {
	const { image, alt, stock, ...rest } = item;
	return {
		...rest,
		stock: stock ?? 0,
		image: toProductImage(image, alt, item.name),
	};
};

const toProduct = (product: ApiProduct): Product => {
	const { image, alt, items, stock, ...rest } = product;
	return {
		...rest,
		stock: stock ?? 0,
		image: toProductImage(image, alt, product.name),
		items: (items ?? []).map((item) => toProductItem(item)),
	};
};

export type ProductStatusFilter = "All" | "Active" | "Inactive";

export interface ListProductsParams {
	search?: string;
	categoryId?: string;
	brandId?: string;
	isActive?: boolean;
	page?: number;
	limit?: number;
}

export interface ListProductsResult {
	data: Product[];
	meta: ApiMeta;
}

export async function listProducts(
	params: ListProductsParams = {},
): Promise<ListProductsResult> {
	const qs = new URLSearchParams();
	if (params.search) qs.set("search", params.search);
	if (params.categoryId) qs.set("categoryId", params.categoryId);
	if (params.brandId) qs.set("brandId", params.brandId);
	if (params.isActive !== undefined)
		qs.set("isActive", String(params.isActive));
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/products${suffix}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<ApiProduct> & { data?: unknown };
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat products (${res.status})`,
		);
	const rawList: ApiProduct[] = Array.isArray(json?.data)
		? (json.data as ApiProduct[])
		: Array.isArray(json)
			? (json as unknown as ApiProduct[])
			: [];
	const data = rawList.map((product) => toProduct(product));
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}

export interface CreateProductPayload {
	categoryId: string;
	brandId: string;
	name: string;
	description?: string;
	isActive?: boolean;
}

export async function createProduct(
	payload: CreateProductPayload,
): Promise<{ message?: string; data?: Product }> {
	const res = await apiFetch("/api/v1/products", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok)
		throw new Error(data?.message ?? `Gagal membuat product (${res.status})`);
	return data;
}

export async function updateProduct(
	id: string,
	payload: Partial<CreateProductPayload>,
): Promise<{ message?: string }> {
	const res = await apiFetch(`/api/v1/products/${id}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok)
		throw new Error(
			data?.message ??
				(res.status === 403
					? "Hanya admin yang dapat mengubah product"
					: `Gagal memperbarui product (${res.status})`),
		);
	return data;
}

export async function deleteProduct(id: string): Promise<{ message?: string }> {
	const res = await apiFetch(`/api/v1/products/${id}`, { method: "DELETE" });
	const data = await res.json().catch(() => ({}));
	if (!res.ok)
		throw new Error(
			data?.message ??
				(res.status === 403
					? "Hanya admin yang dapat menghapus product"
					: `Gagal menghapus product (${res.status})`),
		);
	return data;
}

function productItemError(data: { message?: string }, status: number): string {
	if (data?.message) return data.message;
	if (status === 403) return "Hanya admin yang dapat mengubah product item";
	if (status === 409) return "Product code sudah digunakan";
	if (status === 404) return "Product atau product item tidak ditemukan";
	return `Gagal memproses product item (${status})`;
}

export interface ListProductItemsParams {
	search?: string;
	productId?: string;
	isActive?: boolean;
}

export interface ListProductItemsResult {
	data: ProductItem[];
}

export async function listProductItems(
	params: ListProductItemsParams = {},
): Promise<ListProductItemsResult> {
	const qs = new URLSearchParams();
	if (params.search) qs.set("search", params.search);
	if (params.productId) qs.set("productId", params.productId);
	if (params.isActive !== undefined)
		qs.set("isActive", String(params.isActive));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/product-items${suffix}`);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: unknown;
	};
	if (!res.ok) throw new Error(productItemError(json, res.status));
	const data: ProductItem[] = Array.isArray(json?.data)
		? (json.data as ApiProductItem[]).map((item) => toProductItem(item))
		: [];
	return { data };
}

export interface CreateProductItemPayload {
	productId: string;
	productCode: string;
	name: string;
	price: number | string;
	isActive?: boolean;
}

export async function createProductItem(
	payload: CreateProductItemPayload,
): Promise<{ message?: string; data?: ProductItem }> {
	const res = await apiFetch("/api/v1/product-items", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(productItemError(data, res.status));
	return data;
}

export async function updateProductItem(
	id: string,
	payload: Partial<CreateProductItemPayload>,
): Promise<{ message?: string; data?: ProductItem }> {
	const res = await apiFetch(`/api/v1/product-items/${id}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(productItemError(data, res.status));
	return data;
}

export async function deleteProductItem(
	id: string,
): Promise<{ message?: string }> {
	const res = await apiFetch(`/api/v1/product-items/${id}`, {
		method: "DELETE",
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(productItemError(data, res.status));
	return data;
}
