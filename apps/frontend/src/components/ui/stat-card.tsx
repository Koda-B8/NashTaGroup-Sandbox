import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn, tv } from "tailwind-variants";

import Badge from "./badge";
import Card from "./card";

const statCard = tv({
	base: "flex flex-col justify-between gap-1",
	variants: {
		accent: {
			true: "border-l-4 border-l-primary transition-shadow hover:shadow-sm",
		},
	},
});

export interface StatTrend {
	value: string;
	good: boolean;
}

interface StatCardProps {
	label: ReactNode;
	value: string | number;
	note?: ReactNode;
	trend?: StatTrend;
	icon?: ReactNode;
	iconClassName?: string;
	accent?: boolean;
	loading?: boolean;
	className?: string;
}

export default function StatCard({
	label,
	value,
	note,
	trend,
	icon,
	iconClassName,
	accent = false,
	loading = false,
	className,
}: StatCardProps) {
	const display = loading ? "—" : String(value);

	return (
		<Card
			padding="md"
			className={statCard({ accent, className })}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					{icon && (
						<span
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-lg",
								iconClassName,
							)}
						>
							{icon}
						</span>
					)}
					<p
						className="min-w-0 truncate text-2xl font-bold tracking-tight text-text-h"
						title={display}
					>
						{display}
					</p>
				</div>
				{trend && (
					<Badge
						variant={trend.good ? "valid" : "danger"}
						size="sm"
						className="shrink-0"
					>
						{trend.good ? (
							<ArrowUpRightIcon size={12} />
						) : (
							<ArrowDownRightIcon size={12} />
						)}
						{trend.value}
					</Badge>
				)}
			</div>
			<p className="text-xs font-medium text-text-h">{label}</p>
			{note && <p className="text-xs text-text">{note}</p>}
		</Card>
	);
}

export function StatGrid({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
				className,
			)}
		>
			{children}
		</div>
	);
}
