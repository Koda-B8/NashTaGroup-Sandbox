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
