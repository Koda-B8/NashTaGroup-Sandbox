import { type ImgHTMLAttributes, type ReactNode, useState } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type AvatarShape = "circle" | "square";
type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface AvatarProps extends Omit<
	ImgHTMLAttributes<HTMLImageElement>,
	"size"
> {
	src?: string;
	name?: string;
	size?: AvatarSize;
	shape?: AvatarShape;
	status?: AvatarStatus;
	fallback?: ReactNode;
	className?: string;
}

const sizeClasses: Record<
	AvatarSize,
	{ container: string; text: string; status: string }
> = {
	"xs": { container: "w-6 h-6", text: "text-xs", status: "w-1.5 h-1.5" },
	"sm": { container: "w-8 h-8", text: "text-xs", status: "w-2 h-2" },
	"md": { container: "w-10 h-10", text: "text-sm", status: "w-2.5 h-2.5" },
	"lg": { container: "w-12 h-12", text: "text-base", status: "w-3 h-3" },
	"xl": { container: "w-16 h-16", text: "text-lg", status: "w-3.5 h-3.5" },
	"2xl": { container: "w-20 h-20", text: "text-xl", status: "w-4 h-4" },
};

function getInitials(name: string): string {
	const words = name.trim().split(/\s+/);
	if (words.length === 0 || !words[0]) return "";
	if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
	return (words[0][0] + words.at(-1)[0]).toLocaleLowerCase();
}

export default function Avatar({
	src,
	name,
	size = "md",
	shape = "circle",
	status,
	fallback,
	className = "",
	alt,
	...props
}: AvatarProps) {
	const [hasError, setHasError] = useState(false);
	const {
		container: containerSize,
		text: textSize,
		status: statusSize,
	} = sizeClasses[size];
	const roundedClass = shape === "circle" ? "rounded-full" : "rounded-lg";

	const renderContent = () => {
		if (src && !hasError) {
			return (
				<img
					src={src}
					alt={alt || name || "Avatar"}
					onError={() => setHasError(true)}
					className={`h-full w-full object-cover ${roundedClass}`}
					{...props}
				/>
			);
		}
		if (name) {
			return (
				<span
					className={`font-medium select-none text-gray-700 dark:text-gray-200 ${textSize}`}
				>
					{getInitials(name)}
				</span>
			);
		}

		if (fallback) {
			return fallback;
		}

		return <div></div>;
	};

	return (
		<div
			className={`relative inline-flex shrink-0 ${containerSize} ${className}`}
		>
			<div
				className={`flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800 ${roundedClass} overflow-hidden`}
			>
				{renderContent()}
			</div>
		</div>
	);
}
