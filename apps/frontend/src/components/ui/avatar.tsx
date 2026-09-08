import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const avatar = tv({
	base: "inline-flex shrink-0 items-center justify-center overflow-hidden bg-base align-middle font-medium text-text-h select-none",
	variants: {
		size: {
			"xs": "size-6 text-xs",
			"sm": "size-8 text-xs",
			"md": "size-10 text-sm",
			"lg": "size-12 text-base",
			"xl": "size-16 text-lg",
			"2xl": "size-20 text-xl",
		},
		shape: {
			circle: "rounded-full",
			square: "rounded-lg",
		},
	},
	defaultVariants: { size: "md", shape: "circle" },
});

export type AvatarProps = Omit<BaseAvatar.Root.Props, "className"> &
	VariantProps<typeof avatar> & {
		src?: string;
		alt?: string;
		name?: string;
		fallback?: ReactNode;
		className?: string;
	};

function getInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	const first = words[0]?.[0] ?? "";
	const last = words.length > 1 ? (words.at(-1)?.[0] ?? "") : "";
	return (first + last).toUpperCase();
}

export default function Avatar({
	src,
	alt,
	name,
	fallback,
	size,
	shape,
	className,
	...props
}: AvatarProps) {
	return (
		<BaseAvatar.Root
			className={avatar({ size, shape, className })}
			{...props}
		>
			{src && (
				<BaseAvatar.Image
					src={src}
					alt={alt ?? name}
					className="size-full object-cover"
				/>
			)}
			<BaseAvatar.Fallback className="flex size-full items-center justify-center">
				{name ? getInitials(name) : fallback}
			</BaseAvatar.Fallback>
		</BaseAvatar.Root>
	);
}
