import type { ReactNode } from "react";

import Input, { type InputProps } from "./input";
import Select, { type SelectProps } from "./select";

export default function ListToolbar({
	filters,
	actions,
}: {
	filters: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
			<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
				{filters}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}

export function ListSearch(props: Omit<InputProps, "size" | "className">) {
	return (
		<Input
			size="sm"
			className="w-full sm:max-w-[228px]"
			{...props}
		/>
	);
}

export function ListSort<Value extends string>(
	props: Omit<SelectProps<Value>, "className" | "placeholder">,
) {
	return (
		<Select
			className="size-9 text-xs"
			placeholder="Sort page"
			{...props}
		/>
	);
}
