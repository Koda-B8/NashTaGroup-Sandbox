import { formatRupiah } from "../../libs/formatRupiah";
import type { SalesPeriod } from "./api";

export type TimeRange = "1M" | "3M" | "6M" | "1Y";

export const TIME_RANGE_ITEMS: { label: string; value: TimeRange }[] = [
	{ label: "1M", value: "1M" },
	{ label: "3M", value: "3M" },
	{ label: "6M", value: "6M" },
	{ label: "1Y", value: "1Y" },
];

export function toNumber(value: number | string | null | undefined): number {
	const parsed = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(parsed) ? Number(parsed) : 0;
}

export function formatCurrency(
	value: number | string | null | undefined,
): string {
	return formatRupiah(toNumber(value));
}

export function formatCompactCurrency(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}B`;
	if (abs >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}M`;
	if (abs >= 1e3) return `Rp ${(value / 1e3).toFixed(0)}K`;
	return `Rp ${value}`;
}

export function formatPeriodLabel(
	periodStart: string,
	period: SalesPeriod,
): string {
	const date = new Date(`${periodStart}T00:00:00`);
	if (Number.isNaN(date.getTime())) return periodStart;
	if (period === "year") return String(date.getFullYear());
	if (period === "month")
		return date.toLocaleDateString("en-GB", {
			month: "short",
			year: "2-digit",
		});
	return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function toDateValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function rangeForTimeRange(
	range: TimeRange,
	now: Date,
): { from: string; to: string } {
	const monthsBack = { "1M": 0, "3M": 2, "6M": 5, "1Y": 11 }[range];
	const from = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
	const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return { from: toDateValue(from), to: toDateValue(to) };
}

export function periodForTimeRange(range: TimeRange): SalesPeriod {
	return range === "1M" ? "day" : "month";
}
