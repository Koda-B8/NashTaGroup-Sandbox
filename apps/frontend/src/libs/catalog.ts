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
