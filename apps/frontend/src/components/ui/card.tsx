import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const card = tv({
	base: "rounded-xl border border-base-border bg-white",
	variants: {
		padding: {
			none: "",
			sm: "p-4",
			md: "p-5",
			lg: "p-6",
		},
		accent: { true: "border-l-4 border-l-primary" },
	},
	defaultVariants: { padding: "md" },
});

export type CardProps = ComponentProps<"div"> & VariantProps<typeof card>;

export default function Card({
	padding,
	accent,
	className,
	...props
}: CardProps) {
	return (
		<div
			className={card({ padding, accent, className })}
			{...props}
		/>
	);
}
