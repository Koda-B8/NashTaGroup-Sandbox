import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { tv } from "tailwind-variants";

const overlay = tv({
	base: "fixed inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 transition-opacity duration-200 data-open:opacity-100 data-closed:opacity-0",
});

const popup = tv({
	base: "fixed top-1/2 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-base-border bg-white shadow-xl outline-none max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col data-open:animate-in data-closed:animate-out",
	variants: {
		size: {
			sm: "max-w-sm",
			md: "max-w-md",
			lg: "max-w-lg",
			xl: "max-w-xl",
		},
	},
	defaultVariants: { size: "md" },
});

export interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	size?: "sm" | "md" | "lg" | "xl";
	children: ReactNode;
	/** show close button in header, defaults true when title is set */
	showClose?: boolean;
}

export default function Modal({
	open,
	onOpenChange,
	title,
	description,
	size = "md",
	children,
	showClose = true,
}: ModalProps) {
	return (
		<Dialog.Root
			open={open}
			onOpenChange={onOpenChange}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className={overlay()} />
				<Dialog.Popup className={popup({ size })}>
					{(title || description) && (
						<div className="flex items-start justify-between gap-4 border-b border-base-border px-5 py-4">
							<div className="flex-1">
								{title && (
									<Dialog.Title className="text-sm font-semibold text-text-h">
										{title}
									</Dialog.Title>
								)}
								{description && (
									<Dialog.Description className="mt-1 text-xs text-text">
										{description}
									</Dialog.Description>
								)}
							</div>
							{showClose && (
								<Dialog.Close
									aria-label="Close"
									className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text hover:bg-base hover:text-text-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
								>
									<XIcon size={16} />
								</Dialog.Close>
							)}
						</div>
					)}
					<div className="overflow-y-auto px-5 py-4">{children}</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

// composition helpers for consumers that want custom sections
export function ModalFooter({
	className = "",
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={`flex items-center justify-end gap-2 border-t border-base-border bg-base/50 px-5 py-3 ${className}`}
			{...props}
		/>
	);
}

export function ModalBody({
	className = "",
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={`flex flex-col gap-4 ${className}`}
			{...props}
		/>
	);
}
