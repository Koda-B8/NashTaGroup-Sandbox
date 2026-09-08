import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badge = tv({
	base: "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
	variants: {
		variant: {
			primary: "bg-primary-light text-primary",
			valid: "bg-valid text-deep-valid",
			warn: "bg-warn text-deep-warn",
			danger: "bg-danger text-deep-danger",
			info: "bg-info text-deep-info",
			neutral: "bg-base text-text",
		},
		size: {
			sm: "px-2 py-0.5 text-[11px]",
			md: "px-2.5 py-1 text-xs",
		},
	},
	defaultVariants: { variant: "neutral", size: "md" },
});

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badge>;

export default function Badge({
	variant,
	size,
	className,
	...props
}: BadgeProps) {
	return (
		<span
			className={badge({ variant, size, className })}
			{...props}
		/>
	);
}
