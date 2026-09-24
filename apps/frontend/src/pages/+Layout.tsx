import { Suspense, lazy, type ComponentType } from "react";
import { Outlet, useMatches } from "react-router";

import NavSkeleton from "../components/NavSkeleton";
import Shell from "../components/Shell";

const Navbar = lazy(() => import("../components/Navbar"));

export interface PanelHandle {
	left?: ComponentType;
	right?: ComponentType;
}

export default function MainLayout() {
	const matches = useMatches();
	const handle = matches.findLast((match) => Boolean(match.handle))?.handle as
		| PanelHandle
		| undefined;
	const Left = handle?.left;
	const Right = handle?.right;

	return (
		<Shell
			header={
				<Suspense fallback={<NavSkeleton />}>
					<Navbar />
				</Suspense>
			}
			left={
				Left && (
					<div className="h-full py-2 pl-2">
						<Left />
					</div>
				)
			}
			right={
				Right && (
					<div className="h-full py-2 pr-2">
						<Right />
					</div>
				)
			}
		>
			<div className="p-4">
				<Outlet />
			</div>
		</Shell>
	);
}
