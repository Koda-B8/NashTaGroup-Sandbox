import { ArrowRight, ShoppingCart, Check } from "lucide-react";
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
					Footer={<p className="text-center">Aman dan terenskripsi</p>}
				/>
			);
		}
		case "/struct": {
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
					Footer={<p className="text-center">Aman dan terenskripsi</p>}
				/>
			);
		}
		default: {
			return <AsideContent headerName="Keranjang" />;
		}
	}
}

function SideVariants() {
	const location = useLocation();
	const path = location.pathname;
	switch (path) {
		case "/": {
			return (
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
					Content={
						<div>
							<section className="border-b border-base-border py-3">
								<p className="text-sm font-semibold">KATEGORI</p>
								<ul className="flex flex-col text-[15px] mt-2 w-full ml-0">
									<li className="flex gap-2 items-center justify-start list-outside">
										<input
											type="checkbox"
											name="smartphone"
											id="smartphone"
											className="peer"
										/>
										<label
											htmlFor="smartphone"
											className="peer-checked:text-text-h"
										>
											Smartphone
										</label>
									</li>
									<li className="flex gap-2 items-center justify-start list-outside">
										<input
											type="checkbox"
											name="laptop"
											id="laptop"
											className="peer"
										/>
										<label
											htmlFor="laptop"
											className="peer-checked:text-text-h"
										>
											Laptop
										</label>
									</li>
									<li className="flex gap-2 items-center justify-start list-outside">
										<input
											type="checkbox"
											name="tv"
											id="tv"
											className="peer"
										/>
										<label
											htmlFor="tv"
											className="peer-checked:text-text-h"
										>
											Tv
										</label>
									</li>
								</ul>
							</section>

							<section className="border-b border-base-border py-3">
								<p className="font-semibold text-sm">STATUS</p>
								<ul className="flex flex-col text-[15px] text-ms mt-2 w-full ml-0">
									<li className="flex gap-2 items-center justify-start list-outside">
										<input
											type="checkbox"
											name="instock"
											id="instock"
											className="peer"
										/>
										<label
											htmlFor="instock"
											className="peer-checked:text-text-h"
										>
											In Stock
										</label>
									</li>
									<li className="flex gap-2 items-center justify-start list-outside">
										<input
											type="checkbox"
											name="promo"
											id="promo"
											className="peer"
										/>
										<label
											htmlFor="promo"
											className="peer-checked:text-text-h"
										>
											Promo
										</label>
									</li>
									<li className="flex gap-2 items-center justify-start list-outside">
										<input
											type="checkbox"
											name="bestseller"
											id="bestseller"
											className="peer"
										/>
										<label
											htmlFor="bestseller"
											className="peer-checked:text-text-h"
										>
											Best Seller
										</label>
									</li>
								</ul>
							</section>
						</div>
					}
					Footer={
						<div className="centerized gap-2">
							<Button
								variant={"outline"}
								className="px-6"
							>
								<p>Reset</p>
							</Button>
							<Button
								variant={"primary"}
								className="px-6"
							>
								<p>Terapkan</p>
							</Button>
						</div>
					}
				/>
			);
		}
		case "/checkout": {
			return (
				<AsideContent
					headerName={"Proses Pesanan"}
					Attribute={
						<p className="w-14 text-primary font-semibold text-xs text-right text-wrap">
							Langkah 2/3
						</p>
					}
					Content={
						<div>
							<section className="flex py-3">
								<ul className="flex items-center flex-col w-full gap-4 cursor-pointer">
									<li className="flex items-center w-full gap-3">
										<div className="w-9 h-9 rounded-full centerized border border-primary bg-primary-light">
											<Check
												size={14}
												className="text-primary"
											/>
										</div>
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">Keranjang</p>
											<p>4 produk</p>
										</div>
									</li>
									<li className="flex items-center w-full gap-3">
										<div className="w-9 h-9 rounded-full centerized border border-primary bg-primary">
											{/* <Check size={14} className="text-primary" /> */}
											<p className="text-white  text-sm font-semibold">2</p>
										</div>
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">Pembayaran</p>
											<p>Pilih metode</p>
										</div>
									</li>

									<li className="flex items-center w-full gap-3">
										<div className="w-9 h-9 rounded-full centerized bg-base">
											{/* <Check size={14} className="text-primary" /> */}
											<p className="text-sm font-semibold">3</p>
										</div>
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">Selesai</p>
											<p>Struk dan status</p>
										</div>
									</li>
								</ul>
							</section>
						</div>
					}
					Footer={
						<div className="centerized gap-2">
							<Button
								variant={"outline"}
								className="px-6"
							>
								<p>Batal</p>
							</Button>
							<Button
								variant={"primary"}
								className="px-6"
							>
								<p>Lanjutkan</p>
							</Button>
						</div>
					}
				/>
			);
		}
		case "/struct": {
			return (
				<AsideContent
					headerName={"Proses Pesanan"}
					Attribute={
						<p className="w-14 text-primary font-semibold text-xs text-right text-wrap">
							Langkah 2/3
						</p>
					}
					Content={
						<div>
							<section className="flex py-3">
								<ul className="flex items-center flex-col w-full gap-4 cursor-pointer">
									<li className="flex items-center w-full gap-3">
										<div className="w-9 h-9 rounded-full centerized border border-primary bg-primary-light">
											<Check
												size={14}
												className="text-primary"
											/>
										</div>
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">Keranjang</p>
											<p>4 produk</p>
										</div>
									</li>
									<li className="flex items-center w-full gap-3">
										<div className="w-9 h-9 rounded-full centerized border border-primary bg-primary-light">
											<Check
												size={14}
												className="text-primary"
											/>
										</div>
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">Pembayaran</p>
											<p>Pilih metode</p>
										</div>
									</li>

									<li className="flex items-center w-full gap-3">
										<div className="w-9 h-9 rounded-full centerized bg-primary text-white">
											{/* <Check size={14} className="text-primary" /> */}
											<p className="text-sm font-semibold">3</p>
										</div>
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">Selesai</p>
											<p>Struk dan status</p>
										</div>
									</li>
								</ul>
							</section>
						</div>
					}
					Footer={
						<div className="centerized gap-2">
							<Button
								variant={"outline"}
								className="px-6"
							>
								<p>Batal</p>
							</Button>
							<Button
								variant={"primary"}
								className="px-6"
							>
								<p>Lanjutkan</p>
							</Button>
						</div>
					}
				/>
			);
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
				<aside className="">{SideVariants()}</aside>

				<section className="w-full">
					<Outlet />
				</section>

				<aside>{AsideVariants()}</aside>
			</main>
		</div>
	);
}
