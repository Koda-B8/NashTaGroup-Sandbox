export type StatusFilter = "All" | "Active" | "Inactive";

export type SortBy = "name_asc" | "name_desc" | "updated_desc" | "created_desc";

export const SORT_OPTIONS: { label: string; value: SortBy }[] = [
	{ label: "Name A–Z", value: "name_asc" },
	{ label: "Name Z–A", value: "name_desc" },
	{ label: "Last Updated", value: "updated_desc" },
	{ label: "Created", value: "created_desc" },
];

export const STATUS_ITEMS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "All" },
	{ label: "Active", value: "Active" },
	{ label: "Inactive", value: "Inactive" },
];

export function sortBrands<
	T extends { name: string; createdAt?: string; updatedAt?: string },
>(items: T[], sortBy: SortBy): T[] {
	return [...items].sort((a, b) => {
		if (sortBy === "name_desc") return b.name.localeCompare(a.name);
		if (sortBy === "updated_desc")
			return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
		if (sortBy === "created_desc")
			return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
		return a.name.localeCompare(b.name);
	});
}

export interface BrandStats<T> {
	total: number;
	active: number;
	inactive: number;
	best: T | null;
	activeRate: number;
}

export function buildBrandStats<
	T extends { isActive: boolean; updatedAt?: string },
>(
	pageItems: T[],
	counts: { total: number; active: number } | null,
): BrandStats<T> {
	const total = counts?.total ?? pageItems.length;
	const active = counts?.active ?? pageItems.filter((c) => c.isActive).length;
	const inactive = Math.max(0, total - active);
	const best =
		[...pageItems].sort((a, b) =>
			(b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
		)[0] ?? null;
	const activeRate = total ? Math.round((active / total) * 100) : 0;
	return { total, active, inactive, best, activeRate };
}
