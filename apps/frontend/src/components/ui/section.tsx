import { type ReactNode, useId } from "react";

interface SectionProps {
	title: ReactNode;
	children: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	level?: 2 | 3;
	className?: string;
}

export default function Section({
	title,
	children,
	description,
	action,
	level = 2,
	className = "",
}: SectionProps) {
	const headingId = useId();
	const headingProps = {
		id: headingId,
		className: "text-[11px] font-semibold tracking-wider text-text uppercase",
	};

	return (
		<section
			aria-labelledby={headingId}
			className={`flex flex-col gap-3 ${className}`.trim()}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex flex-col gap-0.5">
					{level === 3 ? (
						<h3 {...headingProps}>{title}</h3>
					) : (
						<h2 {...headingProps}>{title}</h2>
					)}
					{description && <p className="text-xs text-text">{description}</p>}
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}
