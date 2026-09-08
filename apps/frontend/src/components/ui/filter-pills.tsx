import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { useCallback, useMemo } from "react";

export interface FilterPillsProps<Value extends string> {
	items: { label: string; value: Value }[];
	value: Value;
	onValueChange: (value: Value) => void;
	label: string;
	className?: string;
}

export default function FilterPills<Value extends string>({
	items,
	value,
	onValueChange,
	label,
	className = "",
}: FilterPillsProps<Value>) {
	const groupValue = useMemo(() => [value], [value]);
	const handleChange = useCallback(
		// group is single-select, but base-ui always reports an array
		(next: Value[]) => {
			if (next[0]) onValueChange(next[0]);
		},
		[onValueChange],
	);

	return (
		<ToggleGroup
			aria-label={label}
			value={groupValue}
			onValueChange={handleChange}
			className={`flex items-center gap-2 ${className}`}
		>
			{items.map((item) => (
				<Toggle
					key={item.value}
					value={item.value}
					className="h-10 rounded-lg border border-base-border bg-white px-4 text-sm font-medium text-text-h select-none hover:bg-base data-pressed:border-primary data-pressed:bg-primary data-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					{item.label}
				</Toggle>
			))}
		</ToggleGroup>
	);
}
