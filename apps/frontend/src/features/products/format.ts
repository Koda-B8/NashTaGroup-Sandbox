import { formatRupiah } from "../../libs/formatRupiah";
import type { Category } from "../categories/api";
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
export const STOCK_PATTERN = /^\d+$/;

export const MAX_COMBINATIONS = 100;

export interface AttributeOptionRef {
	id: string;
	name: string;
	hex?: string | null;
}

export interface AttributeDefinition {
	id: string;
	name: string;
	isRequired: boolean;
	isVariant: boolean;
	options: AttributeOptionRef[];
}

export interface AttributeSelection {
	attributeId: string;
	optionId: string;
}

export interface VariantCombination {
	key: string;
	selections: AttributeSelection[];
	label: string;
	hex?: string | null;
}

export interface ProductItemDraft {
	key: string;
	selections: AttributeSelection[];
	label: string;
	hex?: string | null;
	productCode: string;
	price: string;
	stock: string;
	isActive: boolean;
}

export interface ProductItemDraftErrors {
	productCode?: string;
	price?: string;
	stock?: string;
}

export function buildAttributeDefinitions(
	category?: Category | null,
): AttributeDefinition[] {
	if (!category?.attributes) return [];
	return category.attributes.flatMap((attribute) => {
		if (!attribute.id) return [];
		const options = (attribute.options ?? []).flatMap((option) =>
			option.id
				? [{ id: option.id, name: option.name, hex: option.hex ?? null }]
				: [],
		);
		if (options.length === 0) return [];
		return [
			{
				id: attribute.id,
				name: attribute.name,
				isRequired: attribute.isRequired ?? false,
				isVariant: attribute.isVariant ?? false,
				options,
			},
		];
	});
}

export function buildCombinations(
	variantDefinitions: AttributeDefinition[],
	selectedByAttribute: Record<string, string[]>,
): VariantCombination[] {
	const dimensions = variantDefinitions
		.map((definition) => ({
			definition,
			options: (selectedByAttribute[definition.id] ?? []).flatMap((id) => {
				const option = definition.options.find(
					(candidate) => candidate.id === id,
				);
				return option ? [option] : [];
			}),
		}))
		.filter((dimension) => dimension.options.length > 0);

	if (dimensions.length === 0) return [];

	let partials: {
		selections: AttributeSelection[];
		names: string[];
		hex: string | null;
	}[] = [{ selections: [], names: [], hex: null }];

	for (const dimension of dimensions) {
		const next: typeof partials = [];
		for (const partial of partials) {
			for (const option of dimension.options) {
				next.push({
					selections: [
						...partial.selections,
						{ attributeId: dimension.definition.id, optionId: option.id },
					],
					names: [...partial.names, option.name],
					hex: partial.hex ?? option.hex ?? null,
				});
			}
		}
		partials = next;
	}

	return partials.map((partial) => ({
		key: partial.selections
			.map((selection) => `${selection.attributeId}:${selection.optionId}`)
			.join("|"),
		selections: partial.selections,
		label: partial.names.join(" · "),
		hex: partial.hex,
	}));
}

const toCodeSegment = (value: string) =>
	value
		.normalize("NFKD")
		.toUpperCase()
		.replaceAll(/[^A-Z0-9]+/g, "-")
		.replaceAll(/^-+|-+$/g, "");

export function suggestProductCode(label: string, index: number): string {
	const base = toCodeSegment(label).slice(0, 46).replaceAll(/-+$/g, "");
	const code = base || `SKU-${index + 1}`;
	return code.slice(0, 50).replaceAll(/-+$/g, "");
}

export function validateProductItemDraft(
	draft: ProductItemDraft,
): ProductItemDraftErrors {
	const errors: ProductItemDraftErrors = {};
	if (!PRODUCT_CODE_PATTERN.test(draft.productCode.trim().toUpperCase()))
		errors.productCode = "Huruf besar, angka, dan tanda hubung (-)";
	const price = draft.price.trim();
	if (!PRICE_PATTERN.test(price) || Number(price) <= 0)
		errors.price = "Angka > 0, maksimal 2 desimal";
	if (!STOCK_PATTERN.test(draft.stock.trim()))
		errors.stock = "Bilangan bulat ≥ 0";
	return errors;
}
