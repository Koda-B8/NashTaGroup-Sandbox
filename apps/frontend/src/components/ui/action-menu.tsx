import { Menu } from "@base-ui/react/menu";
import { EllipsisIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface ActionMenuItem {
	label: string;
	onSelect: () => void;
	icon?: ReactNode;
	danger?: boolean;
	disabled?: boolean;
}

export interface ActionMenuProps {
	items: ActionMenuItem[];
	label: string;
	className?: string;
}

export default function ActionMenu({
	items,
	label,
	className = "",
}: ActionMenuProps) {
	return (
		<Menu.Root>
			<Menu.Trigger
				aria-label={label}
				className={`flex size-8 items-center justify-center rounded-lg text-text select-none hover:bg-base hover:text-text-h data-popup-open:bg-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
			>
				<EllipsisIcon size={16} />
			</Menu.Trigger>

			<Menu.Portal>
				<Menu.Positioner
					sideOffset={4}
					align="end"
					className="z-10 outline-none"
				>
					<Menu.Popup className="min-w-40 rounded-lg border border-base-border bg-white py-1 shadow-lg outline-none">
						{items.map((item) => (
							<Menu.Item
								key={item.label}
								disabled={item.disabled}
								onClick={item.onSelect}
								className={`flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-none select-none data-highlighted:bg-base data-disabled:opacity-50 ${
									item.danger ? "text-deep-danger" : "text-text-h"
								}`}
							>
								{item.icon}
								{item.label}
							</Menu.Item>
						))}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}
