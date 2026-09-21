import { apiFetch } from "../../libs/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../../types/pagination";

export type StockStatus = "available" | "low" | "out_of_stock";

export type AdjustmentType = "addition" | "reduction" | "correction";

export interface InventoryItem {
	id: string;
	productCode: string;
	productName: string;
	variantName: string;
	brand: string;
	category: string;
	stock: number;
	stockStatus: StockStatus;
}

interface ApiInventoryItem {
	product_item_id?: string | null;
	productItemId?: string | null;
	product_code?: string | null;
	productCode?: string | null;
	product_name?: string | null;
	productName?: string | null;
	variant_name?: string | null;
	variantName?: string | null;
	brand?: string | null;
	category?: string | null;
	stock?: number | string | null;
	stock_status?: string | null;
	stockStatus?: string | null;
}

const STOCK_STATUS_VALUES: StockStatus[] = new Set([
	"available",
	"low",
	"out_of_stock",
]);

function parseStock(value: number | string | null | undefined): number {
	const parsed = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(parsed) ? Number(parsed) : 0;
}

export function deriveStockStatus(stock: number): StockStatus {
	if (stock <= 0) return "out_of_stock";
	if (stock <= 9) return "low";
	return "available";
}

function toStockStatus(value: unknown, stock: number): StockStatus {
	return STOCK_STATUS_VALUES.has(value as StockStatus)
		? (value as StockStatus)
		: deriveStockStatus(stock);
}

function toInventoryItem(item: ApiInventoryItem): InventoryItem {
	const stock = parseStock(item.stock);
	return {
		id: item.product_item_id ?? item.productItemId ?? "",
		productCode: item.product_code ?? item.productCode ?? "",
		productName: item.product_name ?? item.productName ?? "",
		variantName: item.variant_name ?? item.variantName ?? "",
		brand: item.brand ?? "—",
		category: item.category ?? "—",
		stock,
		stockStatus: toStockStatus(item.stock_status ?? item.stockStatus, stock),
	};
}

export interface ListInventoriesParams {
	q?: string;
	category_id?: string;
	brand_id?: string;
	stock_status?: StockStatus;
	page?: number;
	limit?: number;
}

export interface ListInventoriesResult {
	data: InventoryItem[];
	meta: ApiMeta;
}

export async function listInventories(
	params: ListInventoriesParams = {},
): Promise<ListInventoriesResult> {
	const qs = new URLSearchParams();
	if (params.q) qs.set("q", params.q);
	if (params.category_id) qs.set("category_id", params.category_id);
	if (params.brand_id) qs.set("brand_id", params.brand_id);
	if (params.stock_status) qs.set("stock_status", params.stock_status);
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/inventories${suffix}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<ApiInventoryItem> & {
		data?: unknown;
	};
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat inventory (${res.status})`,
		);
	const rawList: ApiInventoryItem[] = Array.isArray(json?.data)
		? (json.data as ApiInventoryItem[])
		: [];
	const data = rawList.map((item) => toInventoryItem(item));
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}

export interface AdjustStockPayload {
	type: AdjustmentType;
	quantity: number;
	note?: string;
}

export interface StockAdjustment {
	productItemId: string;
	type: AdjustmentType;
	quantity: number;
	stockBefore: number;
	stockAfter: number;
	note: string | null;
	createdAt: string;
}

interface ApiStockAdjustment {
	product_item_id?: string | null;
	productItemId?: string | null;
	type?: string | null;
	quantity?: number | string | null;
	stock_before?: number | string | null;
	stockBefore?: number | string | null;
	stock_after?: number | string | null;
	stockAfter?: number | string | null;
	note?: string | null;
	created_at?: string | null;
	createdAt?: string | null;
}

function adjustmentError(data: { message?: string }, status: number): string {
	if (data?.message) return data.message;
	if (status === 400) return "Penyesuaian stok tidak valid";
	if (status === 403) return "Hanya admin yang dapat menyesuaikan stok";
	if (status === 404) return "Product item atau inventory tidak ditemukan";
	return `Gagal menyesuaikan stok (${status})`;
}

export async function adjustStock(
	productItemId: string,
	payload: AdjustStockPayload,
): Promise<StockAdjustment> {
	const res = await apiFetch(
		`/api/v1/inventories/${productItemId}/adjustments`,
		{
			method: "POST",
			body: JSON.stringify(payload),
		},
	);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: ApiStockAdjustment;
	};
	if (!res.ok) throw new Error(adjustmentError(json, res.status));
	const raw = json.data ?? {};
	return {
		productItemId: raw.product_item_id ?? raw.productItemId ?? productItemId,
		type: (raw.type as AdjustmentType) ?? payload.type,
		quantity: parseStock(raw.quantity),
		stockBefore: parseStock(raw.stock_before ?? raw.stockBefore),
		stockAfter: parseStock(raw.stock_after ?? raw.stockAfter),
		note: raw.note ?? null,
		createdAt: raw.created_at ?? raw.createdAt ?? "",
	};
}

/* ------------------------------------------------------------------ */
/* Inventory movements (GET /api/v1/inventory-movements)              */
/* ------------------------------------------------------------------ */

export type MovementType = "addition" | "reduction" | "correction";
export type MovementSource = "checkout" | "manual_adjustment";

export interface MovementProductItem {
	id: string;
	productCode: string;
	productName: string;
	variantName: string;
}

export interface MovementTransaction {
	id: string;
	transactionNumber: string;
}

export interface MovementPerformer {
	id: string;
	fullname: string;
}

export interface InventoryMovement {
	id: string;
	productItem: MovementProductItem;
	type: MovementType;
	quantity: number;
	stockBefore: number;
	stockAfter: number;
	note: string | null;
	source: MovementSource;
	transaction: MovementTransaction | null;
	performedBy: MovementPerformer | null;
	createdAt: string;
}

interface ApiMovementProductItem {
	id?: string | null;
	product_code?: string | null;
	product_name?: string | null;
	variant_name?: string | null;
}

interface ApiMovementTransaction {
	id?: string | null;
	transaction_number?: string | null;
}

interface ApiMovementPerformer {
	id?: string | null;
	fullname?: string | null;
}

interface ApiInventoryMovement {
	id?: string | null;
	product_item?: ApiMovementProductItem | null;
	type?: string | null;
	quantity?: number | string | null;
	stock_before?: number | string | null;
	stock_after?: number | string | null;
	note?: string | null;
	source?: string | null;
	transaction?: ApiMovementTransaction | null;
	performed_by?: ApiMovementPerformer | null;
	created_at?: string | null;
}

const MOVEMENT_TYPE_VALUES: MovementType[] = new Set([
	"addition",
	"reduction",
	"correction",
]);
const MOVEMENT_SOURCE_VALUES: MovementSource[] = new Set([
	"checkout",
	"manual_adjustment",
]);

function toMovementType(value: unknown): MovementType {
	return MOVEMENT_TYPE_VALUES.has(value as MovementType)
		? (value as MovementType)
		: "correction";
}

function toMovementSource(value: unknown): MovementSource {
	return MOVEMENT_SOURCE_VALUES.has(value as MovementSource)
		? (value as MovementSource)
		: "manual_adjustment";
}

function toInventoryMovement(item: ApiInventoryMovement): InventoryMovement {
	const productItem = item.product_item ?? {};
	const transaction = item.transaction ?? null;
	const performedBy = item.performed_by ?? null;
	return {
		id: item.id ?? "",
		productItem: {
			id: productItem.id ?? "",
			productCode: productItem.product_code ?? "",
			productName: productItem.product_name ?? "—",
			variantName: productItem.variant_name ?? "",
		},
		type: toMovementType(item.type),
		quantity: parseStock(item.quantity),
		stockBefore: parseStock(item.stock_before),
		stockAfter: parseStock(item.stock_after),
		note: item.note ?? null,
		source: toMovementSource(item.source),
		transaction: transaction?.id
			? {
					id: transaction.id,
					transactionNumber: transaction.transaction_number ?? "—",
				}
			: null,
		performedBy: performedBy?.id
			? { id: performedBy.id, fullname: performedBy.fullname ?? "—" }
			: null,
		createdAt: item.created_at ?? "",
	};
}

export interface ListInventoryMovementsParams {
	q?: string;
	type?: MovementType;
	product_item_id?: string;
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}

export interface ListInventoryMovementsResult {
	data: InventoryMovement[];
	meta: ApiMeta;
}

export async function listInventoryMovements(
	params: ListInventoryMovementsParams = {},
): Promise<ListInventoryMovementsResult> {
	const qs = new URLSearchParams();
	if (params.q) qs.set("q", params.q);
	if (params.type) qs.set("type", params.type);
	if (params.product_item_id) qs.set("product_item_id", params.product_item_id);
	if (params.from) qs.set("from", params.from);
	if (params.to) qs.set("to", params.to);
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/inventory-movements${suffix}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<ApiInventoryMovement> & {
		data?: unknown;
	};
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat riwayat inventory (${res.status})`,
		);
	const rawList: ApiInventoryMovement[] = Array.isArray(json?.data)
		? (json.data as ApiInventoryMovement[])
		: [];
	const data = rawList.map((item) => toInventoryMovement(item));
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}
