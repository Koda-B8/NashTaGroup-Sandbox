import type { ReactNode } from "react";

interface ShellProps {
	header: ReactNode;
	left?: ReactNode;
	right?: ReactNode;
	footer?: ReactNode;
	spanLeft?: boolean;
	children: ReactNode;
}

export default function Shell({
	header,
	left,
	right,
	footer,
	spanLeft = false,
	children,
}: Readonly<ShellProps>) {
	return (
		<div className="grid h-screen grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_1fr_auto] bg-base print:block print:h-auto">
			<div
				className={`print:hidden ${spanLeft ? "col-span-2 col-start-2" : "col-span-3"}`}
			>
				{header}
			</div>
			<div
				className={`min-h-0 overflow-y-auto print:hidden ${spanLeft ? "row-span-2 row-start-1" : ""}`}
			>
				{left}
			</div>
			<main className="min-h-0 overflow-y-auto print:overflow-visible">
				{children}
			</main>
			<div className="min-h-0 overflow-y-auto print:hidden">{right}</div>
			{footer && <div className="col-span-3 print:hidden">{footer}</div>}
		</div>
	);
}
