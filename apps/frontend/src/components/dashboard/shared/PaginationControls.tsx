import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export default function PaginationControls({
	totalLabel,
	pageCount,
	safePage,
	onPageChange,
}: {
	totalLabel: string;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
}) {
	return (
		<div className="flex items-center justify-between border-t border-base-border px-4 py-3">
			<span className="text-xs text-text">{totalLabel}</span>
			<div className="flex items-center gap-1">
				<button
					type="button"
					aria-label="Previous page"
					disabled={safePage === 0}
					onClick={() => onPageChange(Math.max(0, safePage - 1))}
					className="flex size-7 items-center justify-center rounded-lg border border-base-border bg-white text-text-h hover:bg-base disabled:opacity-40"
				>
					<ChevronLeftIcon size={14} />
				</button>
				{Array.from({ length: pageCount }, (_, i) => (
					<button
						key={i}
						type="button"
						aria-label={`Page ${i + 1}`}
						aria-current={safePage === i ? "page" : undefined}
						onClick={() => onPageChange(i)}
						className={`flex size-7 items-center justify-center rounded-lg border text-xs ${safePage === i ? "border-primary bg-primary text-white" : "border-base-border bg-white text-text-h hover:bg-base"}`}
					>
						{i + 1}
					</button>
				))}
				<button
					type="button"
					aria-label="Next page"
					disabled={safePage >= pageCount - 1}
					onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
					className="flex size-7 items-center justify-center rounded-lg border border-base-border bg-white text-text-h hover:bg-base disabled:opacity-40"
				>
					<ChevronRightIcon size={14} />
				</button>
			</div>
		</div>
	);
}
