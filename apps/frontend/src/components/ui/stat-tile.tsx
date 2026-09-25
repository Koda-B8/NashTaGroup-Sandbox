import type { ReactNode } from "react";

interface StatTileProps {
	label: ReactNode;
	value: ReactNode;
	className?: string;
}

export default function StatTile({
	label,
	value,
	className = "",
}: StatTileProps) {
	return (
		<div
			className={`rounded-lg border border-base-border bg-base px-3 py-2.5 ${
				className
			}`.trim()}
		>
			<p className="truncate text-sm font-semibold text-text-h">{value}</p>
			<p className="text-2xs text-text">{label}</p>
		</div>
	);
}

export function StatStrip({ children }: { children: ReactNode }) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-base-border bg-base px-3 py-2.5">
			{children}
		</div>
	);
}

export function StatStripItem({
	label,
	end = false,
	children,
}: {
	label: string;
	end?: boolean;
	children: ReactNode;
}) {
	return (
		<div className={`flex flex-col ${end ? "items-end" : ""}`.trim()}>
			<span className="text-2xs text-text">{label}</span>
			{children}
		</div>
	);
}
