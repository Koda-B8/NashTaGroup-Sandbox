import { apiFetch } from "../../libs/api";
import {
	getPaginationMeta,
	type ApiMeta,
	type PaginatedResponse,
} from "../../types/pagination";

export type TransactionStatus =
	| "pending"
	| "completed"
	| "cancelled"
	| "refunded";

export type MemberType = "member" | "non_member";

export interface TransactionCashier {
	id: string;
	fullname: string;
}

export interface TransactionCustomer {
	id: string;
	name: string | null;
	phone: string | null;
}

export interface TransactionPayment {
	method: string | null;
	status: string | null;
}

export interface Transaction {
	id: string;
	transactionNumber: string;
	status: string;
	cashier: TransactionCashier | null;
	customer: TransactionCustomer | null;
	totalAmount: number | string;
	payment: TransactionPayment;
	createdAt: string;
}

interface ApiCashier {
	id?: string | null;
	fullname?: string | null;
}

interface ApiCustomer {
	id?: string | null;
	name?: string | null;
	phone?: string | null;
}

interface ApiPayment {
	method?: string | null;
	status?: string | null;
}

interface ApiTransaction {
	id?: string | null;
	transaction_number?: string | null;
	status?: string | null;
	cashier?: ApiCashier | null;
	customer?: ApiCustomer | null;
	total_amount?: string | number | null;
	payment?: ApiPayment | null;
	created_at?: string | null;
}

interface ApiTransactionDetailItem {
	product_item_id?: string | null;
	product_name?: string | null;
	product_code?: string | null;
	unit_price?: string | number | null;
	qty?: number | null;
	subtotal?: string | number | null;
}

interface ApiTransactionDetail extends ApiTransaction {
	items?: ApiTransactionDetailItem[] | null;
	summary?: Record<string, unknown> | null;
	payment?: (ApiPayment & Record<string, unknown>) | null;
}

export interface TransactionDetailItem {
	productItemId: string | null;
	productName: string;
	productCode: string | null;
	unitPrice: number | string;
	qty: number;
	subtotal: number | string;
}

export interface TransactionDetail {
	id: string;
	transactionNumber: string;
	status: string;
	customer: TransactionCustomer | null;
	cashier: TransactionCashier | null;
	items: TransactionDetailItem[];
	summary: Record<string, unknown>;
	payment: Record<string, unknown>;
	createdAt: string;
}

const toCashier = (cashier?: ApiCashier | null): TransactionCashier | null =>
	cashier?.id ? { id: cashier.id, fullname: cashier.fullname ?? "—" } : null;

const toCustomer = (
	customer?: ApiCustomer | null,
): TransactionCustomer | null =>
	customer?.id
		? {
				id: customer.id,
				name: customer.name ?? null,
				phone: customer.phone ?? null,
			}
		: null;

const toPayment = (payment?: ApiPayment | null): TransactionPayment => ({
	method: payment?.method ?? null,
	status: payment?.status ?? null,
});

const toTransaction = (transaction: ApiTransaction): Transaction => ({
	id: transaction.id ?? "",
	transactionNumber: transaction.transaction_number ?? "—",
	status: (transaction.status ?? "pending").toLowerCase(),
	cashier: toCashier(transaction.cashier),
	customer: toCustomer(transaction.customer),
	totalAmount: transaction.total_amount ?? 0,
	payment: toPayment(transaction.payment),
	createdAt: transaction.created_at ?? "",
});

const toDetailItem = (
	item: ApiTransactionDetailItem,
): TransactionDetailItem => ({
	productItemId: item.product_item_id ?? null,
	productName: item.product_name ?? "—",
	productCode: item.product_code ?? null,
	unitPrice: item.unit_price ?? 0,
	qty: item.qty ?? 0,
	subtotal: item.subtotal ?? 0,
});

export interface ListTransactionsParams {
	q?: string;
	status?: TransactionStatus;
	member_type?: MemberType;
	month?: string;
	customer_id?: string;
	cashier_id?: string;
	payment_method_id?: string;
	page?: number;
	limit?: number;
}

export interface ListTransactionsResult {
	data: Transaction[];
	meta: ApiMeta;
}

export async function listTransactions(
	params: ListTransactionsParams = {},
): Promise<ListTransactionsResult> {
	const qs = new URLSearchParams();
	if (params.q) qs.set("q", params.q);
	if (params.status) qs.set("status", params.status);
	if (params.member_type) qs.set("member_type", params.member_type);
	if (params.month) qs.set("month", params.month);
	if (params.customer_id) qs.set("customer_id", params.customer_id);
	if (params.cashier_id) qs.set("cashier_id", params.cashier_id);
	if (params.payment_method_id)
		qs.set("payment_method_id", params.payment_method_id);
	if (params.page) qs.set("page", String(params.page));
	if (params.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/transactions${suffix}`);
	const json = (await res
		.json()
		.catch(() => ({}))) as PaginatedResponse<ApiTransaction> & {
		data?: unknown;
	};
	if (!res.ok)
		throw new Error(
			(json as { message?: string })?.message ??
				`Gagal memuat transaksi (${res.status})`,
		);
	const rawList: ApiTransaction[] = Array.isArray(json?.data)
		? (json.data as ApiTransaction[])
		: Array.isArray(json)
			? (json as unknown as ApiTransaction[])
			: [];
	const data = rawList.map((transaction) => toTransaction(transaction));
	const meta: ApiMeta =
		json?.meta ??
		getPaginationMeta(data.length, params.limit ?? 20, params.page ?? 1);
	return { data, meta };
}

export interface PaymentMethod {
	id: string;
	code: string | null;
	name: string;
	type: string | null;
	adminFee: number | string;
	isActive: boolean;
}

interface ApiPaymentMethod {
	id?: string | null;
	code?: string | null;
	name?: string | null;
	type?: string | null;
	admin_fee?: number | string | null;
	is_active?: boolean | null;
}

const toPaymentMethod = (method: ApiPaymentMethod): PaymentMethod => ({
	id: method.id ?? "",
	code: method.code ?? null,
	name: method.name ?? method.code ?? method.id ?? "—",
	type: method.type ?? null,
	adminFee: method.admin_fee ?? 0,
	isActive: method.is_active ?? true,
});

export async function listPaymentMethods(
	params: { is_active?: boolean } = {},
): Promise<PaymentMethod[]> {
	const qs = new URLSearchParams();
	if (params.is_active !== undefined)
		qs.set("is_active", String(params.is_active));
	const suffix = qs.toString() ? `?${qs}` : "";
	const res = await apiFetch(`/api/v1/payment-methods${suffix}`);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: unknown;
	};
	if (!res.ok)
		throw new Error(
			json?.message ?? `Gagal memuat payment methods (${res.status})`,
		);
	const raw: ApiPaymentMethod[] = Array.isArray(json?.data)
		? (json.data as ApiPaymentMethod[])
		: Array.isArray(json)
			? (json as unknown as ApiPaymentMethod[])
			: [];
	return raw.map((method) => toPaymentMethod(method)).filter((m) => m.id);
}

export async function getTransaction(id: string): Promise<TransactionDetail> {
	const res = await apiFetch(`/api/v1/transactions/${id}`);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: ApiTransactionDetail;
	};
	if (!res.ok)
		throw new Error(
			json?.message ?? `Gagal memuat detail transaksi (${res.status})`,
		);
	const data = json?.data;
	if (!data) throw new Error("Detail transaksi tidak ditemukan");
	return {
		id: data.id ?? id,
		transactionNumber: data.transaction_number ?? "—",
		status: (data.status ?? "pending").toLowerCase(),
		customer: toCustomer(data.customer),
		cashier: toCashier(data.cashier),
		items: (data.items ?? []).map((item) => toDetailItem(item)),
		summary: (data.summary ?? {}) as Record<string, unknown>,
		payment: (data.payment ?? {}) as Record<string, unknown>,
		createdAt: data.created_at ?? "",
	};
}
