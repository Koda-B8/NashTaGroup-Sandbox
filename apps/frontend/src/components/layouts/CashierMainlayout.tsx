import { Suspense, lazy } from "react";
import { Outlet } from "react-router";

import NavSkeleton from "../skeletons/NavSkeleton";
import AsideContent from "./Aside";
const Navbar = lazy(() => import("./Navbar"));

export default function MainLayout() {
	return (
		<div className="w-full min-h-screen">
			<header>
				<Suspense fallback={<NavSkeleton />}>
					<Navbar />
				</Suspense>
			</header>

			<main className="flex min-h-screen justify-between p-2">
				<aside className="">
					<AsideContent
						headerName={"Filter"}
						Attribute={<button className="text-primary">Clear</button>}
					/>
				</aside>

				<section>
					<Outlet />
				</section>

				<aside>
					<AsideContent
						headerName={"Keranjang"}
						Attribute={"3 item"}
					/>
				</aside>
			</main>
		</div>
	);
}
