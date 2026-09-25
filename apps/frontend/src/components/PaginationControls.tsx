import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import Button from "./ui/button";

interface PaginationControlsProps {
	totalLabel: string;
	pageCount: number;
	safePage: number;
	onPageChange: (page: number) => void;
	canPreviousPage?: boolean;
	canNextPage?: boolean;
	onPrevious?: () => void;
	onNext?: () => void;
}

export default function PaginationControls({
	totalLabel,
	pageCount,
	safePage,
	onPageChange,
	canPreviousPage,
	canNextPage,
	onPrevious,
	onNext,
}: Readonly<PaginationControlsProps>) {
	const canPrev = canPreviousPage ?? safePage > 0;
	const canNext = canNextPage ?? safePage < pageCount - 1;

	return (
		<div className="mt-6 flex items-center justify-between border-t border-base-border px-4 py-3">
			<span className="text-xs text-text">{totalLabel}</span>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					className="size-7"
					aria-label="Previous page"
					disabled={!canPrev}
					onClick={
						onPrevious ?? (() => onPageChange(Math.max(0, safePage - 1)))
					}
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
					disabled={!canNext}
					onClick={
						onNext ??
						(() => onPageChange(Math.min(pageCount - 1, safePage + 1)))
					}
				>
					<ChevronRightIcon size={14} />
				</Button>
			</div>
		</div>
	);
}
