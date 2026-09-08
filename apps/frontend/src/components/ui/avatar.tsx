import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const avatar = tv({
	base: "inline-flex shrink-0 items-center justify-center overflow-hidden align-middle font-medium select-none",
	variants: {
		tone: {
			neutral: "bg-base text-text-h",
			primary: "bg-primary-light text-primary",
			valid: "bg-valid text-deep-valid",
			warn: "bg-warn text-deep-warn",
			danger: "bg-danger text-deep-danger",
			info: "bg-info text-deep-info",
		},
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
	defaultVariants: { size: "md", shape: "circle", tone: "neutral" },
});

export type AvatarProps = Omit<BaseAvatar.Root.Props, "className"> &
	Omit<VariantProps<typeof avatar>, "tone"> & {
		src?: string;
		alt?: string;
		name?: string;
		fallback?: ReactNode;
		className?: string;
	};

const tones = ["primary", "valid", "warn", "danger", "info"] as const;

// keyed off the initial that is already on screen, so colour follows the person
// and a filtered list never repaints whoever survives it
function toneFor(name: string): (typeof tones)[number] {
	return tones[(name.codePointAt(0) ?? 0) % tones.length]!;
}

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
			className={avatar({
				size,
				shape,
				tone: name ? toneFor(name) : "neutral",
				className,
			})}
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
