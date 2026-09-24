import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import Button from "./ui/button";

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
				<Button
					variant="outline"
					size="icon"
					className="size-7"
					aria-label="Previous page"
					disabled={safePage === 0}
					onClick={() => onPageChange(Math.max(0, safePage - 1))}
				>
					<ChevronLeftIcon size={14} />
				</Button>
				{Array.from({ length: pageCount }, (_, i) => (
					<Button
						key={i}
						variant={safePage === i ? "primary" : "outline"}
						size="icon"
						className="size-7 text-xs"
						aria-label={`Page ${i + 1}`}
						aria-current={safePage === i ? "page" : undefined}
						onClick={() => onPageChange(i)}
					>
						{i + 1}
					</Button>
				))}
				<Button
					variant="outline"
					size="icon"
					className="size-7"
					aria-label="Next page"
					disabled={safePage >= pageCount - 1}
					onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
				>
					<ChevronRightIcon size={14} />
				</Button>
			</div>
		</div>
	);
}
