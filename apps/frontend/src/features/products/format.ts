import { formatRupiah } from "../../libs/formatRupiah";
import type { ProductItem } from "./api";

export type StatusFilter = "All" | "Active" | "Inactive";
export type SortBy =
	| "name_asc"
	| "name_desc"
	| "stock_desc"
	| "price_desc"
	| "updated_desc";

export const SORT_OPTIONS: { label: string; value: SortBy }[] = [
	{ label: "Name A–Z", value: "name_asc" },
	{ label: "Name Z–A", value: "name_desc" },
	{ label: "Stock (High)", value: "stock_desc" },
	{ label: "Price (High)", value: "price_desc" },
	{ label: "Last Updated", value: "updated_desc" },
];

export const STATUS_DOT = {
	Active: "#15803d",
	Inactive: "#94959f",
} as const;

export const STOCK_TONE = {
	out: { label: "Out of stock", className: "text-deep-danger" },
	low: { label: "Low stock", className: "text-deep-warn" },
	ok: { label: "In stock", className: "text-deep-valid" },
} as const;

export function toNumber(value: number | string | null | undefined): number {
	const parsed = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(parsed) ? Number(parsed) : 0;
}

export function priceRange(items: ProductItem[]): { min: number; max: number } {
	if (items.length === 0) return { min: 0, max: 0 };
	const prices = items.map((item) => toNumber(item.price));
	return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function priceLabel(items: ProductItem[]): string {
	const { min, max } = priceRange(items);
	if (!min && !max) return "—";
	if (min === max) return formatRupiah(min);
	return `${formatRupiah(min)} – ${formatRupiah(max)}`;
}

export function stockTone(stock: number) {
	if (stock <= 0) return STOCK_TONE.out;
	if (stock <= 5) return STOCK_TONE.low;
	return STOCK_TONE.ok;
}

export function stockBadgeVariant(stock: number): "valid" | "warn" | "danger" {
	if (stock <= 0) return "danger";
	if (stock <= 5) return "warn";
	return "valid";
}

export function rowClassName(isSelected: boolean, index: number): string {
	if (isSelected) return "border-l-primary bg-primary-light/50";
	if (index % 2 === 1)
		return "border-l-transparent bg-base/40 hover:bg-base/70";
	return "border-l-transparent hover:bg-base/60";
}

export const PRODUCT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,49}$/;
export const PRICE_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

export interface VariantDraft {
	key: string;
	productCode: string;
	name: string;
	price: string;
	isActive: boolean;
}

export interface VariantDraftErrors {
	productCode?: string;
	name?: string;
	price?: string;
}

export function createVariantDraft(key: string): VariantDraft {
	return { key, productCode: "", name: "", price: "", isActive: true };
}

export function validateVariantDraft(draft: VariantDraft): VariantDraftErrors {
	const errors: VariantDraftErrors = {};
	if (!PRODUCT_CODE_PATTERN.test(draft.productCode.trim().toUpperCase()))
		errors.productCode = "Huruf besar, angka, dan tanda hubung (-)";
	if (!draft.name.trim()) errors.name = "Nama varian wajib diisi";
	const price = draft.price.trim();
	if (!PRICE_PATTERN.test(price) || Number(price) <= 0)
		errors.price = "Angka > 0, maksimal 2 desimal";
	return errors;
}
