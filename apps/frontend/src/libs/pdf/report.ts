const JAKARTA = "Asia/Jakarta";

export function toDate(iso: string | null | undefined): Date | null {
	if (!iso) return null;
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDay(value: Date | string | null | undefined): string {
	if (value === null || value === undefined) return "—";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime()))
		return typeof value === "string" ? value : "—";
	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: JAKARTA,
	});
}

export function formatStamp(iso: string | null | undefined): string {
	const date = toDate(iso);
	if (!date) return iso || "—";
	return date
		.toLocaleString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: JAKARTA,
		})
		.replace(",", "");
}

export function formatGeneratedAt(now: Date, user: string): string {
	const stamp = now.toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: JAKARTA,
	});
	return `Exported ${stamp} WIB · ${user}`;
}

export function sanitize(value: string, fallback = "REPORT"): string {
	return (
		value
			.trim()
			.toUpperCase()
			.replaceAll(/[^A-Z0-9]+/g, "-")
			.replaceAll(/^-+|-+$/g, "")
			.slice(0, 40) || fallback
	);
}
