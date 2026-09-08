import { Button as BaseButton } from "@base-ui/react/button";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
	base: "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-disabled:opacity-50 data-disabled:pointer-events-none",
	variants: {
		variant: {
			primary: "bg-primary text-white hover:bg-primary/90",
			outline: "border border-base-border bg-white text-text-h hover:bg-base",
			ghost: "text-text hover:bg-base hover:text-text-h",
			inverse: "bg-white text-primary hover:bg-base",
			danger: "bg-deep-danger text-white hover:bg-deep-danger/90",
		},
		size: {
			sm: "h-8 px-3 text-xs",
			md: "h-10 px-4 text-sm",
			lg: "h-12 px-6 text-base",
			icon: "size-8 p-0",
		},
		block: { true: "w-full" },
	},
	defaultVariants: { variant: "primary", size: "md" },
});

export type ButtonProps = Omit<BaseButton.Props, "className"> &
	VariantProps<typeof button> & { className?: string };

export default function Button({
	variant,
	size,
	block,
	className,
	...props
}: ButtonProps) {
	return (
		<BaseButton
			className={button({ variant, size, block, className })}
			{...props}
		/>
	);
}
