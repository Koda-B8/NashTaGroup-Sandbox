import { ArrowRight, Check, ShoppingCart } from "lucide-react";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router";

import AsideContent from "../components/Aside";
import FilterSkel from "../components/FilterSkel";
import NavSkeleton from "../components/NavSkeleton";
import Shell from "../components/Shell";
import Button from "../components/ui/button";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch, RootState } from "../store";
import { clearCart, type CartItem } from "../store/slices/cart";

const Navbar = lazy(() => import("../components/Navbar"));

interface SummaryProps {
	rows: [label: string, amount: number][];
	total: number;
}

function Summary({ rows, total }: Readonly<SummaryProps>) {
	return (
		<>
			<section className="border-b py-3 text-sm border-b-base-border min-h-10">
				<ul className="flex flex-col gap-1">
					{rows.map(([label, amount]) => (
						<li
							key={label}
							className="flex items-center justify-between"
						>
							<p>{label}</p>
							<p className="text-text-h">{formatRupiah(amount)}</p>
						</li>
					))}
				</ul>
			</section>
			<section className="flex py-3 items-center justify-between">
				<h6>Total</h6>
				<h6>{formatRupiah(total)}</h6>
			</section>
		</>
	);
}

function ClearButton() {
	return (
		<Button
			onClick={handleClearFilter}
			variant={"inverse"}
		>
			<p>Clear</p>
		</Button>
	);
}

function handleClearFilter(): void {
	console.log("Success");
}

const ORDER_STEPS = [
	{ title: "Keranjang", caption: "4 produk" },
	{ title: "Pembayaran", caption: "Pilih metode" },
	{ title: "Selesai", caption: "Struk dan status" },
];

interface OrderStep {
	current: number;
	nextAction: () => void;
}

function OrderSteps({ current, nextAction }: Readonly<OrderStep>) {
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
							{ORDER_STEPS.map((step, index) => {
								const number = index + 1;
								return (
									<li
										key={step.title}
										className="flex items-center w-full gap-3"
									>
										{number < current ? (
											<div className="w-9 h-9 rounded-full centerized border border-primary bg-primary-light">
												<Check
													size={14}
													className="text-primary"
												/>
											</div>
										) : (
											<div
												className={`w-9 h-9 rounded-full centerized ${
													number === current
														? "border border-primary bg-primary text-white"
														: "bg-base"
												}`}
											>
												<p className="text-sm font-semibold">{number}</p>
											</div>
										)}
										<div className="flex text-xs flex-col justify-center text-left ">
											<p className="text-text-h">{step.title}</p>
											<p>{step.caption}</p>
										</div>
									</li>
								);
							})}
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
						onClick={nextAction}
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

function CheckoutSummary({ cart }: Readonly<{ cart: CartItem[] }>) {
	return (
		<AsideContent
			headerName={"Ringkasan"}
			Content={
				<div>
					<Summary
						rows={[
							[
								"Subtotal",
								cart.reduce((total, item) => total + item.qty * item.price, 0),
							],
							["Pajak", 1000],
							["Diskon", 1000],
						]}
						total={
							cart.length > 0
								? cart.reduce(
										(total, item) => total + item.qty * item.price,
										0,
									) -
									(5000 - 1000)
								: 0
						}
					/>
				</div>
			}
			Footer={<p className="text-center">Aman dan terenskripsi</p>}
		/>
	);
}

interface Categories {
	id: string;
	name: string;
}

interface FilterCats {
	title: string;
	options: Categories[];
}

export default function MainLayout() {
	const path = useLocation().pathname;
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const [loading, setLoading] = useState<boolean>(true);
	const cart = useSelector((state: RootState) => state.cart.cart);
	const [filterGroups, setFilterGroups] = useState<FilterCats[]>([]);

	function handleCheckout(): void {
		navigate("/struct");
	}

	function handleBack(): void {
		dispatch(clearCart());
		navigate("/");
	}

	useEffect(() => {
		async function getCategories() {
			setLoading(true);
			try {
				const data = await apiFetch("/api/v1/categories");
				const res = await data.json();

				const cat: FilterCats = {
					title: "Kategori",
					options: res.data,
				};
				setFilterGroups([cat]);

				// const FILTER_GROUPS = [
				// 	{
				// 		title: "KATEGORI",
				// 		options: [
				// 			{ id: "smartphone", label: "Smartphone" },
				// 			{ id: "laptop", label: "Laptop" },
				// 			{ id: "tv", label: "Tv" },
				// 		],
				// 	},
				// 	{
				// 		title: "STATUS",
				// 		options: [
				// 			{ id: "instock", label: "In Stock" },
				// 			{ id: "promo", label: "Promo" },
				// 			{ id: "bestseller", label: "Best Seller" },
				// 		],
				// 	},
				// ];
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		}
		getCategories();
	}, []);

	const panels: Record<string, { left?: ReactNode; right?: ReactNode }> = {
		"/": {
			left: (
				<AsideContent
					headerName={"Filters"}
					Attribute={<ClearButton />}
					Content={
						<div>
							{loading ? (
								<FilterSkel count={4} />
							) : (
								<>
									{filterGroups.map((group) => (
										<section
											key={group.title}
											className="border-b border-base-border py-3"
										>
											<p className="text-sm font-semibold">{group.title}</p>
											<ul className="flex flex-col gap-1 text-[15px] mt-2 w-full ml-0">
												{group.options.map((option) => (
													<li
														key={option.id}
														className="flex gap-2 items-center justify-start list-outside"
													>
														<input
															type="checkbox"
															name={option.id}
															id={option.id}
															className="peer"
														/>
														<label
															htmlFor={option.id}
															className="peer-checked:text-text-h text-sm"
														>
															{option.name}
														</label>
													</li>
												))}
											</ul>
										</section>
									))}
								</>
							)}
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
			),
			right: (
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
												key={item.id}
												className="flex items-center justify-between"
											>
												<section className="flex items-center gap-3 py-2">
													<div className="w-10 h-10 rounded-lg bg-base relative">
														<div
															className="min-w-4 h-4 px-1 absolute top-0 left-0 rounded-full
														text-[9px] font-bold bg-primary centerized text-white"
														>
															{item.qty}
														</div>
													</div>
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

							<Summary
								rows={[
									[
										"Subtotal",
										cart.reduce(
											(total, item) => total + item.qty * item.price,
											0,
										),
									],
									["Diskon", 5000],
								]}
								total={
									cart.length > 0
										? cart.reduce(
												(total, item) => total + item.qty * item.price,
												0,
											) - 5000
										: 0
								}
							/>
						</div>
					}
					Footer={
						<Button
							onClick={() => navigate("/checkout")}
							className="w-full"
						>
							<p>Checkout</p>
							<ArrowRight size={15} />
						</Button>
					}
				/>
			),
		},

		"/checkout": {
			left: (
				<OrderSteps
					current={2}
					nextAction={handleCheckout}
				/>
			),
			right: <CheckoutSummary cart={cart} />,
		},
		"/struct": {
			left: (
				<OrderSteps
					nextAction={handleBack}
					current={3}
				/>
			),
			right: <CheckoutSummary cart={cart} />,
		},
	};

	const { left, right } = panels[path] ?? {
		right: <AsideContent headerName="Keranjang" />,
	};

	return (
		<Shell
			header={
				<Suspense fallback={<NavSkeleton />}>
					<Navbar />
				</Suspense>
			}
			left={left && <div className="h-full py-2 pl-2">{left}</div>}
			right={<div className="h-full py-2 pr-2">{right}</div>}
		>
			<div className="p-2">
				<Outlet />
			</div>
		</Shell>
	);
}
