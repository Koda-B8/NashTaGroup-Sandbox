import { Popover } from "@base-ui/react/popover";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const MONTH_VALUE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_LABELS = Array.from({ length: 12 }, (_, index) =>
	new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
		new Date(2024, index, 1),
	),
);

export function isMonthValue(value: string): boolean {
	return MONTH_VALUE_PATTERN.test(value);
}

export function parseMonthValue(
	value: string,
): { year: number; month: number } | null {
	if (!isMonthValue(value)) return null;
	const [year, month] = value.split("-");
	return { year: Number(year), month: Number(month) };
}

export function formatMonthValue(value: string): string {
	const parsed = parseMonthValue(value);
	if (!parsed) return value;
	return new Intl.DateTimeFormat("en-GB", {
		month: "long",
		year: "numeric",
	}).format(new Date(parsed.year, parsed.month - 1, 1));
}

export function toMonthValue(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, "0")}`;
}

const trigger = tv({
	base: "flex items-center justify-between gap-2 rounded-lg border border-base-border bg-surface text-text-h select-none hover:bg-base data-popup-open:bg-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
	variants: {
		size: {
			sm: "h-8 min-w-36 px-3 text-xs",
			md: "h-10 min-w-40 px-3 text-sm",
			lg: "h-12 min-w-44 px-4 text-base",
		},
	},
	defaultVariants: { size: "md" },
});

const navButton = tv({
	base: "flex size-6 items-center justify-center rounded-md text-text hover:bg-base hover:text-text-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
});

const monthCell = tv({
	base: "flex h-8 items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
	variants: {
		selected: {
			true: "bg-primary text-white",
			false: "text-text-h hover:bg-base",
		},
		current: {
			true: "ring-1 ring-primary/40 ring-inset",
			false: "",
		},
	},
	defaultVariants: { selected: false, current: false },
});

const footerButton = tv({
	base: "rounded-md px-2 py-1 text-2xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
	variants: {
		primary: {
			true: "text-primary hover:bg-primary-light",
			false: "text-text hover:bg-base hover:text-text-h",
		},
	},
	defaultVariants: { primary: false },
});

export type DatePickerView = "months";

export type DatePickerProps = VariantProps<typeof trigger> & {
	value: string;
	onValueChange: (value: string) => void;
	label: string;
	placeholder?: string;
	className?: string;
	clearable?: boolean;
	view?: DatePickerView;
};

export default function DatePicker({
	value,
	onValueChange,
	label,
	placeholder = "All months",
	size,
	className,
	clearable = true,
	view = "months",
}: DatePickerProps) {
	const now = useMemo(() => new Date(), []);
	const [viewYear, setViewYear] = useState(
		() => parseMonthValue(value)?.year ?? now.getFullYear(),
	);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) setViewYear(parseMonthValue(value)?.year ?? now.getFullYear());
		},
		[value, now],
	);

	const handleSelect = useCallback(
		(month: number) => onValueChange(toMonthValue(viewYear, month)),
		[onValueChange, viewYear],
	);

	const handleClear = useCallback(() => onValueChange(""), [onValueChange]);

	const handleThisMonth = useCallback(
		() => onValueChange(toMonthValue(now.getFullYear(), now.getMonth() + 1)),
		[onValueChange, now],
	);

	return (
		<Popover.Root onOpenChange={handleOpenChange}>
			<Popover.Trigger
				aria-label={label}
				className={trigger({ size, className })}
			>
				<span className={`truncate ${value ? "" : "text-text"}`}>
					{value ? formatMonthValue(value) : placeholder}
				</span>
				<CalendarIcon
					size={16}
					className="shrink-0 text-text"
				/>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Positioner
					sideOffset={4}
					align="start"
					className="z-10 outline-none"
				>
					<Popover.Popup className="w-64 rounded-lg border border-base-border bg-surface p-3 shadow-lg outline-none">
						{view === "months" && (
							<>
								<div className="mb-2 flex items-center justify-between">
									<button
										type="button"
										aria-label="Previous year"
										onClick={() => setViewYear((year) => year - 1)}
										className={navButton()}
									>
										<ChevronLeftIcon size={14} />
									</button>
									<span className="text-xs font-semibold text-text-h">
										{viewYear}
									</span>
									<button
										type="button"
										aria-label="Next year"
										onClick={() => setViewYear((year) => year + 1)}
										className={navButton()}
									>
										<ChevronRightIcon size={14} />
									</button>
								</div>

								<div className="grid grid-cols-4 gap-1">
									{MONTH_LABELS.map((monthText, index) => {
										const monthValue = toMonthValue(viewYear, index + 1);
										const isSelected = value === monthValue;
										const isCurrent =
											viewYear === now.getFullYear() &&
											index === now.getMonth();
										return (
											<Popover.Close
												key={monthValue}
												aria-pressed={isSelected}
												onClick={() => handleSelect(index + 1)}
												className={monthCell({
													selected: isSelected,
													current: isCurrent,
												})}
											>
												{monthText}
											</Popover.Close>
										);
									})}
								</div>

								<div className="mt-3 flex items-center justify-between border-t border-base-border pt-2">
									{clearable ? (
										<Popover.Close
											onClick={handleClear}
											className={footerButton()}
										>
											Clear
										</Popover.Close>
									) : (
										<span />
									)}
									<Popover.Close
										onClick={handleThisMonth}
										className={footerButton({ primary: true })}
									>
										This month
									</Popover.Close>
								</div>
							</>
						)}
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}
