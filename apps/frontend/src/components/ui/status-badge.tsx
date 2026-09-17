import type { ReactNode } from "react";

import Badge, { type BadgeProps } from "./badge";

export type StatusBadgeVariant = NonNullable<BadgeProps["variant"]>;
export type StatusBadgeSize = NonNullable<BadgeProps["size"]>;

interface StatusBadgeProps {
	label: ReactNode;
	dotColor?: string;
	variant?: StatusBadgeVariant;
	size?: StatusBadgeSize;
	className?: string;
}

export default function StatusBadge({
	label,
	dotColor,
	variant = "neutral",
	size = "sm",
	className = "",
}: StatusBadgeProps) {
	return (
		<Badge
			variant={variant}
			size={size}
			className={`gap-1.5 ${className}`.trim()}
		>
			{dotColor && (
				<span
					className="size-1.5 shrink-0 rounded-full"
					style={{ backgroundColor: dotColor }}
					aria-hidden
				/>
			)}
			{label}
		</Badge>
	);
}

export function ActiveBadge({
	isActive,
	className,
}: {
	isActive: boolean;
	className?: string;
}) {
	return (
		<Badge
			variant={isActive ? "primary" : "neutral"}
			size="sm"
			className={className}
		>
			{isActive ? "Active" : "Inactive"}
		</Badge>
	);
}
