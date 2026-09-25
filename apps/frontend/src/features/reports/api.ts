import { apiFetch } from "../../libs/api";
import type { ApiMeta } from "../../types/pagination";

export type SalesPeriod = "day" | "week" | "month" | "year";

export interface ReportFilters {
	from?: string;
	to?: string;
	period?: SalesPeriod;
	page?: number;
	limit?: number;
}

interface ReportEnvelope {
	message?: string;
	data?: unknown;
	meta?: ApiMeta | null;
}

function buildQuery(
	params: Record<string, string | number | undefined>,
): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === "") continue;
		search.set(key, String(value));
	}
	const qs = search.toString();
	return qs ? `?${qs}` : "";
}

async function fetchReport<T>(
	report: string,
	params: Record<string, string | number | undefined>,
): Promise<{ data: T; meta: ApiMeta | null }> {
	const res = await apiFetch(`/api/v1/reports/${report}${buildQuery(params)}`);
	const json = (await res.json().catch(() => ({}))) as ReportEnvelope;
	if (!res.ok) {
		throw new Error(json?.message ?? `Gagal memuat report (${res.status})`);
	}
	return { data: json.data as T, meta: json.meta ?? null };
}

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

export interface SalesSummary {
	transaction_count: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	average_transaction: string;
}

export interface SalesReportRow {
	period_start: string;
	transaction_count: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	average_transaction: string;
}

export interface SalesReport {
	period: SalesPeriod;
	timezone: string;
	summary: SalesSummary;
	rows: SalesReportRow[];
}

export async function getSalesReport(filters: ReportFilters = {}) {
	return fetchReport<SalesReport>("sales", {
		from: filters.from,
		to: filters.to,
		period: filters.period,
		page: filters.page,
		limit: filters.limit,
	});
}

/* -------------------------------------------------------------------------- */
/* Products & inventory                                                       */
/* -------------------------------------------------------------------------- */

export interface ProductReportSummary {
	variants: number;
	current_stock: number;
	units_sold: number;
	gross_sales: string;
	stock_in: number;
	stock_out: number;
	corrections: number;
	revenue?: string;
}

export interface ProductReportItem {
	product_item_id: string;
	product_code: string;
	variant_name: string;
	product_id: string;
	product_name: string;
	current_stock: number;
	transaction_count: number;
	units_sold: number;
	gross_sales: string;
	stock_in: number;
	stock_out: number;
	corrections: number;
	revenue?: string;
}

export interface ProductReportTransaction {
	id: string;
	detail_id: string;
	transaction_number: string;
	created_at: string;
	customer_id: string | null;
	customer_name: string | null;
	product_item_id: string;
	product_name: string;
	product_code: string;
	qty: number;
	subtotal: string;
}

export interface ProductReport {
	timezone: string;
	summary: ProductReportSummary;
	items: ProductReportItem[];
	transactions?: ProductReportTransaction[];
}

export async function getProductReport(filters: ReportFilters = {}) {
	return fetchReport<ProductReport>("products", {
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

export interface InventoryMovementRow {
	id: string;
	created_at: string;
	type: "addition" | "reduction" | "correction";
	quantity: number;
	stock_before: number;
	stock_after: number;
	note: string | null;
	product_code: string;
	variant_name: string;
	product_name: string;
	transaction_number: string | null;
	performed_by: string;
}

export interface InventoryReport {
	timezone: string;
	summary: ProductReportSummary;
	items: ProductReportItem[];
	movements?: InventoryMovementRow[];
}

export async function getInventoryReport(filters: ReportFilters = {}) {
	return fetchReport<InventoryReport>("inventory", {
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

/* -------------------------------------------------------------------------- */
/* Payment methods & cashiers                                                 */
/* -------------------------------------------------------------------------- */

export interface ReconciliationSummary {
	transaction_count: number;
	paid_transaction_count: number;
	missing_payment_count: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	collected_amount: string;
	payment_gap: string;
}

export interface PaymentMethodReportRow {
	payment_method_id: string;
	code: string;
	name: string;
	type: string;
	is_active: boolean;
	transaction_count: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	collected_amount: string;
	cash_tendered: string;
	change_given: string;
	payment_gap: string;
	last_transaction_at: string | null;
}

export interface PaymentMethodReport {
	timezone: string;
	summary: ReconciliationSummary;
	methods: PaymentMethodReportRow[];
}

export async function getPaymentMethodReport(filters: ReportFilters = {}) {
	return fetchReport<PaymentMethodReport>("payment-methods", {
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

export interface CashierReportRow {
	cashier_id: string;
	fullname: string;
	username: string;
	role: string;
	transaction_count: number;
	member_transactions: number;
	non_member_transactions: number;
	paid_transaction_count: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	average_transaction: string;
	collected_amount: string;
	payment_gap: string;
	last_transaction_at: string | null;
}

export interface CashierReport {
	timezone: string;
	summary: ReconciliationSummary;
	cashiers: CashierReportRow[];
}

export async function getCashierReport(filters: ReportFilters = {}) {
	return fetchReport<CashierReport>("cashiers", {
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export interface CustomerProductRow {
	product_item_id: string;
	product_name: string;
	product_code: string;
	quantity: number;
	subtotal: string;
}

export interface CustomerReportSummary {
	transactions: number;
	member_transactions: number;
	non_member_transactions: number;
	active_members: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	non_member_total_sales: string;
	revenue: string;
	non_member_revenue: string;
}

export interface CustomerReportMember {
	id: string;
	name: string | null;
	phone: string;
	transaction_count: number;
	total_spent: string;
	last_transaction_at: string | null;
	products: CustomerProductRow[];
}

export interface CustomerReport {
	timezone: string;
	summary: CustomerReportSummary;
	members: CustomerReportMember[];
	non_member_products: CustomerProductRow[];
}

export async function getCustomerReport(filters: ReportFilters = {}) {
	return fetchReport<CustomerReport>("customers", {
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

/* -------------------------------------------------------------------------- */
/* Detail reports                                                             */
/* -------------------------------------------------------------------------- */

export type CustomerDetailView = "transactions" | "products" | "cashiers";

export interface CustomerDetailSummary {
	transaction_count: number;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	average_transaction: string;
	last_transaction_at: string | null;
}

export interface CustomerDetailTransaction {
	transaction_id: string;
	transaction_number: string;
	created_at: string;
	gross_sales: string;
	discount_amount: string;
	tax_amount: string;
	total_sales: string;
	cashier_id: string;
	cashier_name: string;
	payment_method_name: string | null;
}

export interface CustomerDetailProduct {
	product_id: string;
	product_name: string;
	transaction_count: number;
	units_bought: number;
	gross_sales: string;
	last_transaction_at: string | null;
}

export interface CustomerDetailCashier {
	cashier_id: string;
	cashier_name: string;
	cashier_username: string;
	transaction_count: number;
	total_sales: string;
	last_transaction_at: string | null;
}

export interface CustomerDetailReport {
	customer: { id: string; name: string | null; phone: string };
	timezone: string;
	summary: CustomerDetailSummary;
	view: CustomerDetailView;
	transactions?: CustomerDetailTransaction[];
	products?: CustomerDetailProduct[];
	cashiers?: CustomerDetailCashier[];
}

export async function getCustomerDetailReport(
	customerId: string,
	filters: ReportFilters & { view?: CustomerDetailView } = {},
) {
	return fetchReport<CustomerDetailReport>(`customers/${customerId}`, {
		view: filters.view,
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

export type ProductDetailView = "transactions" | "customers" | "cashiers";

export interface ProductDetailSummary {
	transaction_count: number;
	member_transactions: number;
	non_member_transactions: number;
	units_sold: number;
	gross_sales: string;
}

export interface ProductDetailTransaction {
	transaction_id: string;
	transaction_number: string;
	created_at: string;
	customer_id: string | null;
	customer_name: string | null;
	customer_phone: string | null;
	cashier_id: string;
	cashier_name: string;
	quantity: number;
	gross_sales: string;
}

export interface ProductDetailCustomer {
	customer_id: string | null;
	customer_name: string | null;
	customer_phone: string | null;
	transaction_count: number;
	units_sold: number;
	gross_sales: string;
	last_transaction_at: string | null;
}

export interface ProductDetailCashier {
	cashier_id: string;
	cashier_name: string;
	cashier_username: string;
	transaction_count: number;
	units_sold: number;
	gross_sales: string;
	last_transaction_at: string | null;
}

export interface ProductDetailReport {
	product: {
		id: string;
		name: string;
		description: string | null;
		is_active: boolean;
	};
	timezone: string;
	summary: ProductDetailSummary;
	view: ProductDetailView;
	transactions?: ProductDetailTransaction[];
	customers?: ProductDetailCustomer[];
	cashiers?: ProductDetailCashier[];
}

export async function getProductDetailReport(
	productId: string,
	filters: ReportFilters & { view?: ProductDetailView } = {},
) {
	return fetchReport<ProductDetailReport>(`products/${productId}`, {
		view: filters.view,
		from: filters.from,
		to: filters.to,
		page: filters.page,
		limit: filters.limit,
	});
}

/* -------------------------------------------------------------------------- */
/* Export (used by the frontend PDF generator — wired up later)               */
/* -------------------------------------------------------------------------- */

export type ExportReportType =
	| "customers"
	| "products"
	| "inventory"
	| "sales"
	| "payment-methods"
	| "cashiers";

export interface ExportMeta {
	export: { row_count: number; max_rows: number };
}

export async function exportReportData(
	report: ExportReportType,
	filters: ReportFilters = {},
): Promise<{ data: unknown; meta: ExportMeta | null }> {
	const res = await apiFetch(
		`/api/v1/reports/${report}/export${buildQuery({
			from: filters.from,
			to: filters.to,
			period: filters.period,
		})}`,
	);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: unknown;
		meta?: ExportMeta | null;
	};
	if (!res.ok) {
		throw new Error(json?.message ?? `Gagal menyiapkan export (${res.status})`);
	}
	return { data: json.data ?? null, meta: json.meta ?? null };
}

export async function exportCustomerDetailReport(
	customerId: string,
	filters: ReportFilters & { view?: CustomerDetailView } = {},
): Promise<{ data: unknown; meta: ExportMeta | null }> {
	const res = await apiFetch(
		`/api/v1/reports/customers/${customerId}/export${buildQuery({
			view: filters.view,
			from: filters.from,
			to: filters.to,
		})}`,
	);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: unknown;
		meta?: ExportMeta | null;
	};
	if (!res.ok) {
		throw new Error(json?.message ?? `Gagal menyiapkan export (${res.status})`);
	}
	return { data: json.data ?? null, meta: json.meta ?? null };
}

export async function exportProductDetailReport(
	productId: string,
	filters: ReportFilters & { view?: ProductDetailView } = {},
): Promise<{ data: unknown; meta: ExportMeta | null }> {
	const res = await apiFetch(
		`/api/v1/reports/products/${productId}/export${buildQuery({
			view: filters.view,
			from: filters.from,
			to: filters.to,
		})}`,
	);
	const json = (await res.json().catch(() => ({}))) as {
		message?: string;
		data?: unknown;
		meta?: ExportMeta | null;
	};
	if (!res.ok) {
		throw new Error(json?.message ?? `Gagal menyiapkan export (${res.status})`);
	}
	return { data: json.data ?? null, meta: json.meta ?? null };
}
