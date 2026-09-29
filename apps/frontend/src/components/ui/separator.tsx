import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cn } from "tailwind-variants";

export default function Separator({
	className,
	...props
}: Readonly<Omit<BaseSeparator.Props, "className"> & { className?: string }>) {
	return (
		<BaseSeparator
			className={cn(
				"shrink-0 bg-base-border data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
				className,
			)}
			{...props}
		/>
	);
}
