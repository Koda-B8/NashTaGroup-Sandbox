import type { ComponentProps, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const card = tv({
	base: "rounded-lg border border-base-border bg-surface",
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

export function CardHeader({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h5 className="font-bold">{title}</h5>
				<p className="text-xs text-text">{description}</p>
			</div>
			{children}
		</div>
	);
}
