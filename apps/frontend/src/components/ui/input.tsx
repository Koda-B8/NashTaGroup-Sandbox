import { Input as BaseInput } from "@base-ui/react/input";
import { tv, type VariantProps } from "tailwind-variants";

const input = tv({
	base: "w-full rounded-lg border border-base-border bg-white text-text-h placeholder:text-text focus:outline-2 focus:-outline-offset-1 focus:outline-primary disabled:opacity-50",
	variants: {
		size: {
			sm: "h-8 px-3 text-xs",
			md: "h-10 px-3 text-sm",
			lg: "h-12 px-4 text-base",
		},
		invalid: { true: "border-deep-danger focus:outline-deep-danger" },
	},
	defaultVariants: { size: "md" },
});

export type InputProps = Omit<BaseInput.Props, "className" | "size"> &
	VariantProps<typeof input> & { className?: string };

export default function Input({
	size,
	invalid,
	className,
	...props
}: InputProps) {
	return (
		<BaseInput
			className={input({ size, invalid, className })}
			{...props}
		/>
	);
}
