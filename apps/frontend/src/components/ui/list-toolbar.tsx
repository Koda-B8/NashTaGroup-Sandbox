import type { ReactNode } from "react";

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
