import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
const Navbar = lazy(() => import("../components/layouts/Navbar"));
import NavSkeleton from "../components/skeletons/NavSkeleton";

export default function Layout() {
	return (
		<>
			<Suspense fallback={<NavSkeleton />}>
				<Navbar />
			</Suspense>
			<Outlet />
		</>
	);
}
