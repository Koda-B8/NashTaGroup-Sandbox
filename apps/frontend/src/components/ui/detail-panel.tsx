import type { ReactNode } from "react";
import { cn } from "tailwind-variants";

import Card from "./card";

interface DetailPanelProps {
	/** shown instead of children when there is nothing selected */
	empty?: ReactNode;
	children?: ReactNode;
	className?: string;
}

export default function DetailPanel({
	empty,
	children,
	className,
}: Readonly<DetailPanelProps>) {
	return (
		<Card
			padding="md"
			className={cn("flex h-fit flex-col gap-4 xl:sticky xl:top-4", className)}
		>
			{empty === undefined ? (
				children
			) : (
				<p className="py-10 text-center text-sm text-text">{empty}</p>
			)}
		</Card>
	);
}

export function DetailLine({
	label,
	value,
}: Readonly<{ label: ReactNode; value: ReactNode }>) {
	return (
		<div className="flex items-baseline justify-between gap-2">
			<span className="text-xs text-text">{label}</span>
			<span className="text-xs font-medium text-text-h">{value}</span>
		</div>
	);
}

export function DetailLayout({
	wide = false,
	children,
}: Readonly<{ wide?: boolean; children: ReactNode }>) {
	return (
		<div
			className={
				wide
					? "grid grid-cols-1 gap-4 @6xl:grid-cols-[1fr_320px]"
					: "grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]"
			}
		>
			{children}
		</div>
	);
}
