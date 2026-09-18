import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const toast = tv({
	base: "flex items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm",
	variants: {
		variant: {
			success: "border-valid bg-valid text-deep-valid",
			error: "border-danger bg-danger text-deep-danger",
			warn: "border-warn bg-warn text-deep-warn",
			info: "border-info bg-info text-deep-info",
		},
	},
	defaultVariants: { variant: "success" },
});

export type ToastVariant = NonNullable<VariantProps<typeof toast>["variant"]>;

interface ToastProps {
	message?: ReactNode;
	variant?: ToastVariant;
	onDismiss?: () => void;
	dismissLabel?: string;
	className?: string;
}

export default function Toast({
	message,
	variant,
	onDismiss,
	dismissLabel = "Tutup",
	className = "",
}: ToastProps) {
	if (message === null || message === undefined || message === "") return null;

	return (
		<div
			className={toast({ variant, className })}
			role={variant === "error" ? "alert" : "status"}
		>
			<span>{message}</span>
			{onDismiss && (
				<button
					type="button"
					onClick={onDismiss}
					className="shrink-0 font-semibold underline"
				>
					{dismissLabel}
				</button>
			)}
		</div>
	);
}
