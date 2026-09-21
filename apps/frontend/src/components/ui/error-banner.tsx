import type { ReactNode } from "react";

interface ErrorBannerProps {
	message: ReactNode;
	onRetry?: () => void;
	retryLabel?: string;
}

export default function ErrorBanner({
	message,
	onRetry,
	retryLabel = "Coba lagi",
}: ErrorBannerProps) {
	return (
		<div
			role="alert"
			className="rounded-lg border border-danger bg-danger px-4 py-3 text-sm text-deep-danger"
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
