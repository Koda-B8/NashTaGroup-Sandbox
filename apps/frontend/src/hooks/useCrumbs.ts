import { useMatches } from "react-router";

import type { Crumb } from "../components/ui/breadcrumb";

export interface CrumbHandle {
	crumbs?: Crumb[];
}

// routes declare their own trail through `handle`, the same channel the cashier
// layout already uses for its side panels
export function useCrumbs(): Crumb[] {
	const matches = useMatches();
	return (
		(
			matches.findLast(
				(match) => (match.handle as CrumbHandle | undefined)?.crumbs,
			)?.handle as CrumbHandle | undefined
		)?.crumbs ?? []
	);
}
