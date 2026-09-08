import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { type ReactNode, useCallback, useMemo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const filterPillsContainer = tv({
	base: "inline-flex items-center select-none overflow-x-auto scrollbar-none",
	variants: {
		variant: {
			outline: "gap-2",
			ghost: "gap-1.5",
			segmented: "p-1 rounded-xl bg-base border border-base-border/60 gap-1",
			card: "p-1 rounded-xl bg-base/50 border border-base-border/60 gap-1.5",
		},
		fullWidth: {
			true: "w-full flex",
		},
	},
	defaultVariants: {
		variant: "outline",
		fullWidth: false,
	},
});

const filterItem = tv({
	base: "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-disabled:opacity-40 data-disabled:pointer-events-none",
	variants: {
		variant: {
			outline:
				"border border-base-border bg-white text-text-h hover:bg-base hover:border-text/20 data-pressed:border-primary data-pressed:bg-primary data-pressed:text-white data-pressed:shadow-xs",
			ghost:
				"text-text hover:bg-base hover:text-text-h data-pressed:bg-primary-light data-pressed:text-primary data-pressed:font-semibold",
			segmented:
				"text-text hover:text-text-h data-pressed:bg-white data-pressed:text-primary data-pressed:shadow-xs data-pressed:font-semibold",
			card: "text-text hover:text-text-h hover:bg-white/60 data-pressed:bg-white data-pressed:text-primary data-pressed:shadow-xs data-pressed:font-semibold",
		},
		size: {
			xs: "h-7 px-2.5 text-xs gap-1",
			sm: "h-8 px-3 text-xs gap-1.5",
			md: "h-9 px-3.5 text-sm gap-1.5",
			lg: "h-11 px-4 text-base gap-2",
		},
		shape: {
			rounded: "rounded-lg",
			pill: "rounded-full",
			square: "rounded-none",
			sm: "rounded-md",
		},
		fullWidth: {
			true: "flex-1",
		},
	},
	defaultVariants: {
		variant: "outline",
		size: "sm",
		shape: "rounded",
		fullWidth: false,
	},
});

export interface FilterItem<Value extends string> {
	label: ReactNode;
	value: Value;
	icon?: ReactNode;
	badge?: string | number;
	disabled?: boolean;
}

export interface FilterPillsProps<Value extends string> extends VariantProps<
	typeof filterItem
> {
	items: FilterItem<Value>[];
	value: Value;
	onValueChange: (value: Value) => void;
	label: string;
	className?: string;
	containerClassName?: string;
}

export default function FilterPills<Value extends string>({
	items,
	value,
	onValueChange,
	label,
	size = "sm",
	variant = "outline",
	shape = "rounded",
	fullWidth = false,
	className = "",
	containerClassName = "",
}: FilterPillsProps<Value>) {
	const groupValue = useMemo(() => [value], [value]);
	const handleChange = useCallback(
		(next: Value[]) => {
			if (next[0]) onValueChange(next[0]);
		},
		[onValueChange],
	);

	return (
		<ToggleGroup
			aria-label={label}
			value={groupValue}
			onValueChange={handleChange}
			className={filterPillsContainer({
				variant,
				fullWidth,
				className: `${containerClassName} ${className}`.trim(),
			})}
		>
			{items.map((item) => (
				<Toggle
					key={item.value}
					value={item.value}
					disabled={item.disabled}
					className={filterItem({
						variant,
						size,
						shape,
						fullWidth,
					})}
				>
					{item.icon && (
						<span className="shrink-0 opacity-80">{item.icon}</span>
					)}
					<span>{item.label}</span>
					{item.badge !== undefined && (
						<span
							className={`ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
								value === item.value
									? variant === "outline"
										? "bg-white/20 text-white"
										: "bg-primary-light text-primary"
									: "bg-base-border/60 text-text"
							}`}
						>
							{item.badge}
						</span>
					)}
				</Toggle>
			))}
		</ToggleGroup>
	);
}
