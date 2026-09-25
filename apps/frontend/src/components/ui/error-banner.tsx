import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const errorBanner = tv({
	base: "rounded-lg border border-danger bg-danger text-deep-danger",
	variants: {
		size: {
			sm: "px-3 py-2 text-xs",
			md: "px-4 py-3 text-sm",
		},
	},
	defaultVariants: { size: "md" },
});

type ErrorBannerProps = VariantProps<typeof errorBanner> & {
	message: ReactNode;
	onRetry?: () => void;
	retryLabel?: string;
	className?: string;
};

export default function ErrorBanner({
	message,
	onRetry,
	retryLabel = "Coba lagi",
	size,
	className,
}: Readonly<ErrorBannerProps>) {
	return (
		<div
			role="alert"
			className={errorBanner({ size, className })}
		>
			{message}
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="ml-2 font-semibold underline"
				>
					{retryLabel}
				</button>
			)}
		</div>
	);
}
