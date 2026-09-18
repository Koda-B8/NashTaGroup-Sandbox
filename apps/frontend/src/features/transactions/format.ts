import type { BadgeProps } from "../../components/ui/badge";
import type { MemberType, Transaction, TransactionStatus } from "./api";

export type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export type StatusFilter = "All" | TransactionStatus;
export type MemberFilter = "All" | MemberType;
export type SortBy = "newest" | "oldest" | "amount_desc" | "amount_asc";

export const SORT_OPTIONS: { label: string; value: SortBy }[] = [
	{ label: "Newest First", value: "newest" },
	{ label: "Oldest First", value: "oldest" },
	{ label: "Amount (High)", value: "amount_desc" },
	{ label: "Amount (Low)", value: "amount_asc" },
];

export const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "All" },
	{ label: "Pending", value: "pending" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
	{ label: "Refunded", value: "refunded" },
];

export const MEMBER_OPTIONS: { label: string; value: MemberFilter }[] = [
	{ label: "All", value: "All" },
	{ label: "Member", value: "member" },
	{ label: "Non-member", value: "non_member" },
];

const STATUS_LABEL: Record<string, string> = {
	pending: "Pending",
	completed: "Completed",
	cancelled: "Cancelled",
	refunded: "Refunded",
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
	pending: "warn",
	completed: "valid",
	cancelled: "danger",
	refunded: "info",
};

const STATUS_DOT: Record<string, string> = {
	pending: "#b45309",
	completed: "#148552",
	cancelled: "#b91c1c",
	refunded: "#6d28d9",
};

const PAID_STATUS = new Set(["paid", "settled", "success", "succeeded"]);
const WAITING_STATUS = new Set(["pending", "unpaid", "waiting"]);
const FAILED_STATUS = ["failed", "expired", "cancelled", "canceled"];
const REFUND_STATUS = ["refunded", "refund"];

const AMOUNT_KEY = /(amount|price|total|subtotal|paid|change|discount|tax|fee)/;

export function statusLabel(status: string): string {
	return STATUS_LABEL[status] ?? prettifyKey(status);
}

export function statusVariant(status: string): BadgeVariant {
	return STATUS_VARIANT[status] ?? "neutral";
}

export function statusDot(status: string): string {
	return STATUS_DOT[status] ?? "#94959f";
}

export function paymentStatusVariant(status: string | null): BadgeVariant {
	if (!status) return "neutral";
	const normalized = status.toLowerCase();
	if (PAID_STATUS.has(normalized)) return "valid";
	if (WAITING_STATUS.has(normalized)) return "warn";
	if (FAILED_STATUS.includes(normalized)) return "danger";
	if (REFUND_STATUS.includes(normalized)) return "info";
	return "neutral";
}

export function memberTypeOf(transaction: Transaction): MemberType {
	return transaction.customer ? "member" : "non_member";
}

export function memberLabel(transaction: Transaction): string {
	return transaction.customer ? "Member" : "Non-member";
}

export function toNumber(value: number | string | null | undefined): number {
	const parsed = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(parsed) ? Number(parsed) : 0;
}

export function asString(value: unknown): string | null {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	return null;
}

export function isPrimitive(
	value: unknown,
): value is string | number | boolean {
	return (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	);
}

export function isAmountKey(key: string): boolean {
	return AMOUNT_KEY.test(key.toLowerCase());
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

export function formatTime(iso?: string | null): string {
	if (!iso) return "—";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function prettifyKey(key: string): string {
	return key
		.replaceAll(/[_-]+/g, " ")
		.replaceAll(/\s+/g, " ")
		.trim()
		.replaceAll(/\b\w/g, (char) => char.toUpperCase());
}
