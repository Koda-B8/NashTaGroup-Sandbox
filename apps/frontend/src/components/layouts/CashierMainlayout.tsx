import { ArrowRight, ShoppingCart } from "lucide-react";
import { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router";

import { formatRupiah } from "../../libs/formatRupiah";
import type { RootState } from "../../store";
import NavSkeleton from "../skeletons/NavSkeleton";
import Button from "../ui/button";
import AsideContent from "./Aside";

const Navbar = lazy(() => import("./Navbar"));

function AsideVariants() {
	const location = useLocation();
	const path = location.pathname;
	const navigate = useNavigate();
	const cart = useSelector((state: RootState) => state.cart.cart);

	function handleCheckout(): void {
		navigate("/checkout");
	}

	switch (path) {
		case "/": {
			return (
				<AsideContent
					headerName={"Keranjang"}
					Attribute={`${cart.length} item`}
					Content={
						<div>
							{cart.length > 0 ? (
								<section className="min-h-2 border-b py-2 border-base-border">
									<div className="flex flex-col gap-2">
										{cart.map((item) => (
											<div
												key={item.uuid}
												className="flex items-center justify-between"
											>
												<section className="flex items-center gap-3 py-2">
													<div className="w-10 h-10 rounded-lg bg-base"></div>
													<div className="flex flex-col justify-center text-left">
														<p className="text-text-h text-sm">{item.name}</p>
														<p className="text-sm">
															{formatRupiah(item.price)}
														</p>
													</div>
												</section>
											</div>
										))}
									</div>
								</section>
							) : (
								<div className="border-b gap-2 flex  py-2 h-66 border-base-border centerized">
									<ShoppingCart
										strokeWidth={2.5}
										size={17}
									/>
									<p className="font-semibold text-sm">Keranjang Kosong</p>
								</div>
							)}

							<section className="border-b py-3 text-sm border-b-base-border min-h-10">
								<ul className="flex flex-col gap-1">
									<li className="flex items-center justify-between">
										<p>Subtotal</p>
										<p className="text-text-h">{formatRupiah(15_000)}</p>
									</li>
									<li className="flex items-center justify-between">
										<p>Diskon</p>
										<p className="text-text-h">{formatRupiah(5000)}</p>
									</li>
								</ul>
							</section>
							<section className="flex py-3 items-center justify-between">
								<h6>Total</h6>
								<h6>{formatRupiah(10_000)}</h6>
							</section>
						</div>
					}
					Footer={
						<Button
							onClick={handleCheckout}
							className="w-full"
						>
							<p>Checkout</p>
							<ArrowRight size={15} />
						</Button>
					}
				/>
			);
		}
		case "/checkout": {
			return (
				<AsideContent
					headerName={"Ringkasan"}
					Content={
						<div>
							<section className="border-b py-3 text-sm border-b-base-border min-h-10">
								<ul className="flex flex-col gap-1">
									<li className="flex items-center justify-between">
										<p>Subtotal</p>
										<p className="text-text-h">{formatRupiah(15_000)}</p>
									</li>
									<li className="flex items-center justify-between">
										<p>Pajak</p>
										<p className="text-text-h">{formatRupiah(1000)}</p>
									</li>
									<li className="flex items-center justify-between">
										<p>Diskon</p>
										<p className="text-text-h">{formatRupiah(1000)}</p>
									</li>
								</ul>
							</section>
							<section className="flex py-3 items-center justify-between">
								<h6>Total</h6>
								<h6>{formatRupiah(13_000)}</h6>
							</section>
						</div>
					}
					Footer={<p>Aman dan terenskripsi</p>}
				/>
			);
		}
		default: {
			return <AsideContent headerName="Keranjang" />;
		}
	}
}

function handleClearFilter(): void {
	console.log("Success");
}

export default function MainLayout() {
	return (
		<div className="w-full bg-base min-h-screen">
			<header>
				<Suspense fallback={<NavSkeleton />}>
					<Navbar />
				</Suspense>
			</header>

			<main className="flex min-h-screen justify-between p-2">
				<aside className="">
					<AsideContent
						headerName={"Filters"}
						Attribute={
							<Button
								onClick={handleClearFilter}
								variant={"inverse"}
							>
								<p>Clear</p>
							</Button>
						}
					/>
				</aside>

				<section className="w-full">
					<Outlet />
				</section>

				<aside>{AsideVariants()}</aside>
			</main>
		</div>
	);
}
