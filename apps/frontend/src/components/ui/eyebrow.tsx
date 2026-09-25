import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const eyebrow = tv({
	base: "font-semibold tracking-wider text-text uppercase",
	variants: {
		size: {
			sm: "text-3xs",
			md: "text-2xs",
		},
	},
	defaultVariants: { size: "md" },
});

export default function Eyebrow({
	size,
	className,
	...props
}: ComponentProps<"p"> & VariantProps<typeof eyebrow>) {
	return (
		<p
			className={eyebrow({ size, className })}
			{...props}
		/>
	);
}
