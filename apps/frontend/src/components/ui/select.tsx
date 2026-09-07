import { Select as BaseSelect } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useCallback } from "react";

export interface SelectProps<Value extends string> {
	items: { label: string; value: Value }[];
	value?: Value;
	defaultValue?: Value;
	onValueChange?: (value: Value) => void;
	placeholder?: string;
	label: string;
	className?: string;
}

export default function Select<Value extends string>({
	items,
	value,
	defaultValue,
	onValueChange,
	placeholder,
	label,
	className = "",
}: SelectProps<Value>) {
	const handleChange = useCallback(
		(next: Value | null) => {
			if (next !== null) onValueChange?.(next);
		},
		[onValueChange],
	);

	return (
		<BaseSelect.Root
			items={items}
			value={value}
			defaultValue={defaultValue}
			onValueChange={handleChange}
		>
			<BaseSelect.Trigger
				aria-label={label}
				className={`flex h-10 min-w-40 items-center justify-between gap-3 rounded-lg border border-base-border bg-white px-3 text-sm text-text-h select-none hover:bg-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
			>
				<BaseSelect.Value
					placeholder={placeholder}
					className="data-placeholder:text-text"
				/>
				<BaseSelect.Icon className="text-text">
					<ChevronDownIcon size={16} />
				</BaseSelect.Icon>
			</BaseSelect.Trigger>

			<BaseSelect.Portal>
				<BaseSelect.Positioner
					sideOffset={4}
					className="z-10 outline-none"
				>
					<BaseSelect.Popup className="min-w-[var(--anchor-width)] rounded-lg border border-base-border bg-white py-1 shadow-lg outline-none">
						<BaseSelect.List className="max-h-[var(--available-height)] overflow-y-auto">
							{items.map((item) => (
								<BaseSelect.Item
									key={item.value}
									value={item.value}
									className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm text-text-h outline-none select-none data-highlighted:bg-primary-light data-highlighted:text-primary"
								>
									<BaseSelect.ItemIndicator className="col-start-1">
										<CheckIcon size={14} />
									</BaseSelect.ItemIndicator>
									<BaseSelect.ItemText className="col-start-2">
										{item.label}
									</BaseSelect.ItemText>
								</BaseSelect.Item>
							))}
						</BaseSelect.List>
					</BaseSelect.Popup>
				</BaseSelect.Positioner>
			</BaseSelect.Portal>
		</BaseSelect.Root>
	);
}
