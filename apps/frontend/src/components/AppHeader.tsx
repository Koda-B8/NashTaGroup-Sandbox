import type { ReactNode } from "react";

import Breadcrumb, { type Crumb } from "./ui/breadcrumb";

interface AppHeaderProps {
	leading?: ReactNode;
	items: Crumb[];
	actions?: ReactNode;
}

export default function AppHeader({
	leading,
	items,
	actions,
}: Readonly<AppHeaderProps>) {
	return (
		<header className="flex h-14 w-full shrink-0 items-center gap-4 border-b border-base-border bg-white px-4">
			{leading}
			<Breadcrumb items={items} />
			<div className="ml-auto flex items-center gap-3">{actions}</div>
		</header>
	);
}
