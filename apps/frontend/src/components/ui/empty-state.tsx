import type { ReactNode } from "react";

export default function EmptyState({ children }: { children: ReactNode }) {
	return (
		<p className="rounded-lg border border-dashed border-base-border px-3 py-4 text-center text-xs text-text">
			{children}
		</p>
	);
}
