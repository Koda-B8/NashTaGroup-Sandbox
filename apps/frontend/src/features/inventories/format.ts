import type {
	InventoryItem,
	InventoryMovement,
	MovementSource,
	MovementType,
	StockStatus,
} from "./api";

export type StockStatusFilter = "All" | "Available" | "Low" | "Out of Stock";

export type SortBy =
	| "name_asc"
	| "name_desc"
	| "stock_desc"
	| "stock_asc"
	| "code_asc";

export const SORT_OPTIONS: { label: string; value: SortBy }[] = [
	{ label: "Name A–Z", value: "name_asc" },
	{ label: "Name Z–A", value: "name_desc" },
	{ label: "Stock (High)", value: "stock_desc" },
	{ label: "Stock (Low)", value: "stock_asc" },
	{ label: "Product Code", value: "code_asc" },
];

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
	available: "Available",
	low: "Low",
	out_of_stock: "Out of Stock",
};

export const STOCK_STATUS_TONE: Record<
	StockStatus,
	{ variant: "valid" | "warn" | "danger"; dot: string }
> = {
	available: { variant: "valid", dot: "#15803d" },
	low: { variant: "warn", dot: "#a65f00" },
	out_of_stock: { variant: "danger", dot: "#dc2626" },
};

export const STOCK_STATUS_TEXT: Record<StockStatus, string> = {
	available: "text-deep-valid",
	low: "text-deep-warn",
	out_of_stock: "text-deep-danger",
};

export function toNumber(value: number | string | null | undefined): number {
	const parsed = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(parsed) ? Number(parsed) : 0;
}

export function stockStatusFilterToParam(
	filter: StockStatusFilter,
): StockStatus | undefined {
	if (filter === "Available") return "available";
	if (filter === "Low") return "low";
	if (filter === "Out of Stock") return "out_of_stock";
	return undefined;
}

export function sortInventories<T extends InventoryItem>(
	items: T[],
	sortBy: SortBy,
): T[] {
	return [...items].sort((a, b) => {
		if (sortBy === "name_desc")
			return b.productName.localeCompare(a.productName);
		if (sortBy === "stock_desc") return toNumber(b.stock) - toNumber(a.stock);
		if (sortBy === "stock_asc") return toNumber(a.stock) - toNumber(b.stock);
		if (sortBy === "code_asc")
			return a.productCode.localeCompare(b.productCode);
		return a.productName.localeCompare(b.productName);
	});
}

/* ------------------------------------------------------------------ */
/* Inventory movements                                                */
/* ------------------------------------------------------------------ */

export type MovementTypeFilter = "All" | MovementType;
export type MovementSortBy = "newest" | "oldest";

export const MOVEMENT_TYPE_OPTIONS: {
	label: string;
	value: MovementTypeFilter;
}[] = [
	{ label: "All", value: "All" },
	{ label: "Addition", value: "addition" },
	{ label: "Reduction", value: "reduction" },
	{ label: "Correction", value: "correction" },
];

export const MOVEMENT_SORT_OPTIONS: {
	label: string;
	value: MovementSortBy;
}[] = [
	{ label: "Newest First", value: "newest" },
	{ label: "Oldest First", value: "oldest" },
];

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
	addition: "Addition",
	reduction: "Reduction",
	correction: "Correction",
};

export const MOVEMENT_TYPE_TONE: Record<
	MovementType,
	{ variant: "valid" | "danger" | "info"; dot: string }
> = {
	addition: { variant: "valid", dot: "#15803d" },
	reduction: { variant: "danger", dot: "#dc2626" },
	correction: { variant: "info", dot: "#6d28d9" },
};

export const MOVEMENT_TYPE_TEXT: Record<MovementType, string> = {
	addition: "text-deep-valid",
	reduction: "text-deep-danger",
	correction: "text-deep-info",
};

export const MOVEMENT_SOURCE_LABEL: Record<MovementSource, string> = {
	checkout: "Checkout",
	manual_adjustment: "Manual Adjustment",
};

export function movementTypeFilterToParam(
	filter: MovementTypeFilter,
): MovementType | undefined {
	return filter === "All" ? undefined : filter;
}

export function formatMovementQuantity(
	type: MovementType,
	quantity: number,
): string {
	if (type === "addition") return `+${quantity}`;
	if (type === "reduction") return `-${quantity}`;
	return String(quantity);
}

export function sortMovements<T extends InventoryMovement>(
	items: T[],
	sortBy: MovementSortBy,
): T[] {
	return [...items].sort((a, b) => {
		if (sortBy === "oldest") return a.createdAt.localeCompare(b.createdAt);
		return b.createdAt.localeCompare(a.createdAt);
	});
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function monthStart(month: string): string | undefined {
	if (!MONTH_PATTERN.test(month)) return undefined;
	return `${month}-01`;
}

export function monthEnd(month: string): string | undefined {
	if (!MONTH_PATTERN.test(month)) return undefined;
	const [year, monthIndex] = month.split("-").map(Number);
	const lastDay = new Date(year, monthIndex, 0).getDate();
	return `${month}-${String(lastDay).padStart(2, "0")}`;
}

export function monthLabel(month: string): string | undefined {
	if (!MONTH_PATTERN.test(month)) return undefined;
	const [year, monthIndex] = month.split("-").map(Number);
	return new Date(year, monthIndex - 1, 1).toLocaleDateString("en-GB", {
		month: "short",
		year: "numeric",
	});
}

export function monthRangeLabel(
	fromMonth: string,
	toMonth: string,
): string | undefined {
	const from = monthLabel(fromMonth);
	const to = monthLabel(toMonth);
	if (from && to) return `${from} – ${to}`;
	if (from) return `From ${from}`;
	if (to) return `Until ${to}`;
	return undefined;
}

export function formatDateTime(iso?: string | null): string {
	if (!iso) return "—";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
