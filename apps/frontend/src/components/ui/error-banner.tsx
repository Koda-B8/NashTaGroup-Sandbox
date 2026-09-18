import type { ReactNode } from "react";

interface ErrorBannerProps {
	message: ReactNode;
	onRetry?: () => void;
	retryLabel?: string;
	action?: ReactNode;
	className?: string;
}

export default function ErrorBanner({
	message,
	onRetry,
	retryLabel = "Coba lagi",
	action,
	className = "",
}: ErrorBannerProps) {
	return (
		<div
			role="alert"
			className={`rounded-lg border border-danger bg-danger px-4 py-3 text-sm text-deep-danger ${className}`.trim()}
		>
			{message}
			{action ??
				(onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="ml-2 font-semibold underline"
					>
						{retryLabel}
					</button>
				))}
		</div>
	);
}
