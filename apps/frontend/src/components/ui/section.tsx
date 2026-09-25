import { type ReactNode, useId } from "react";
import { cn } from "tailwind-variants";

import { eyebrow } from "./eyebrow";

interface SectionProps {
	title: ReactNode;
	children: ReactNode;
	description?: ReactNode;
	className?: string;
}

export default function Section({
	title,
	children,
	description,
	className,
}: SectionProps) {
	const headingId = useId();

	return (
		<section
			aria-labelledby={headingId}
			className={cn("flex flex-col gap-3", className)}
		>
			<div className="flex flex-col gap-0.5">
				<h2
					id={headingId}
					className={eyebrow()}
				>
					{title}
				</h2>
				{description && <p className="text-xs text-text">{description}</p>}
			</div>
			{children}
		</section>
	);
}
