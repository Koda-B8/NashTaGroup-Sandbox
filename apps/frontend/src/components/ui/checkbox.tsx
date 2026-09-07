import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";

export type CheckboxProps = Omit<BaseCheckbox.Root.Props, "className"> & {
	className?: string;
};

export default function Checkbox({ className = "", ...props }: CheckboxProps) {
	return (
		<BaseCheckbox.Root
			className={`flex size-4 shrink-0 items-center justify-center rounded border border-base-border bg-white text-white data-checked:border-primary data-checked:bg-primary data-indeterminate:border-primary data-indeterminate:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-disabled:opacity-50 ${className}`}
			{...props}
		>
			<BaseCheckbox.Indicator className="flex data-unchecked:hidden">
				{props.indeterminate ? (
					<MinusIcon
						size={12}
						strokeWidth={3}
					/>
				) : (
					<CheckIcon
						size={12}
						strokeWidth={3}
					/>
				)}
			</BaseCheckbox.Indicator>
		</BaseCheckbox.Root>
	);
}
