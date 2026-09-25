import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const inputGroup = tv({
	base: "relative flex items-center rounded-lg border border-base-border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
	variants: {
		size: {
			sm: "h-8",
			md: "h-10",
			lg: "h-12",
		},
	},
	defaultVariants: { size: "md" },
});

const input = tv({
	base: "h-full w-full border-0 bg-transparent text-text-h outline-none placeholder:text-text disabled:opacity-50",
	variants: {
		size: {
			sm: "pr-7 pl-3 text-xs",
			md: "pr-8 pl-3 text-sm",
			lg: "pr-9 pl-4 text-base",
		},
	},
	defaultVariants: { size: "md" },
});

export interface ComboboxItem<Value extends string> {
	label: string;
	value: Value;
	description?: string;
}

export type ComboboxProps<Value extends string> = VariantProps<
	typeof inputGroup
> & {
	items: ComboboxItem<Value>[];
	value: Value;
	onValueChange: (value: Value) => void;
	label: string;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
};

export default function Combobox<Value extends string>({
	items,
	value,
	onValueChange,
	label,
	placeholder = "Search...",
	emptyMessage = "No options found.",
	size,
	className,
}: ComboboxProps<Value>) {
	const selectedItem = useMemo(
		() => items.find((item) => item.value === value) ?? null,
		[items, value],
	);

	return (
		<BaseCombobox.Root
			items={items}
			value={selectedItem}
			onValueChange={(next) => {
				if (next) onValueChange(next.value);
			}}
			isItemEqualToValue={(a, b) => a.value === b.value}
			itemToStringLabel={(item) => item.label}
			filter={(item, query) =>
				`${item.label} ${item.description ?? ""}`
					.toLowerCase()
					.includes(query.trim().toLowerCase())
			}
			autoHighlight
			openOnInputClick
		>
			<BaseCombobox.InputGroup className={inputGroup({ size, className })}>
				<BaseCombobox.Input
					aria-label={label}
					placeholder={placeholder}
					className={input({ size })}
				/>
				<BaseCombobox.Trigger
					aria-label={`${label} — open options`}
					className="absolute right-1.5 flex size-5 items-center justify-center rounded-lg text-text hover:text-text-h focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					<ChevronDownIcon size={16} />
				</BaseCombobox.Trigger>
			</BaseCombobox.InputGroup>

			<BaseCombobox.Portal>
				<BaseCombobox.Positioner
					sideOffset={4}
					align="start"
					className="z-10 outline-none"
				>
					<BaseCombobox.Popup className="w-[var(--anchor-width)] min-w-52 rounded-lg border border-base-border bg-surface py-1 shadow-lg outline-none">
						<BaseCombobox.Empty>
							<div className="px-3 py-2 text-xs text-text">{emptyMessage}</div>
						</BaseCombobox.Empty>
						<BaseCombobox.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto outline-none">
							{(item: ComboboxItem<Value>) => (
								<BaseCombobox.Item
									key={item.value}
									value={item}
									className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-2.5 py-2 text-sm text-text-h outline-none select-none data-highlighted:bg-primary-light data-highlighted:text-primary"
								>
									<BaseCombobox.ItemIndicator className="col-start-1">
										<CheckIcon size={14} />
									</BaseCombobox.ItemIndicator>
									<span className="col-start-2 flex min-w-0 flex-col">
										<span className="truncate">{item.label}</span>
										{item.description && (
											<span className="truncate text-2xs text-text">
												{item.description}
											</span>
										)}
									</span>
								</BaseCombobox.Item>
							)}
						</BaseCombobox.List>
					</BaseCombobox.Popup>
				</BaseCombobox.Positioner>
			</BaseCombobox.Portal>
		</BaseCombobox.Root>
	);
}
