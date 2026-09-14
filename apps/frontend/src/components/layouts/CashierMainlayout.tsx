import { ArrowRight, Check, ShoppingCart } from "lucide-react";
import { Suspense, lazy, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router";

import { formatRupiah } from "../../libs/formatRupiah";
import type { RootState } from "../../store";
import NavSkeleton from "../skeletons/NavSkeleton";
import Button from "../ui/button";
import AsideContent from "./Aside";
import Shell from "./Shell";

const Navbar = lazy(() => import("./Navbar"));

const FILTER_GROUPS = [
	{
		title: "KATEGORI",
		options: [
			{ id: "smartphone", label: "Smartphone" },
			{ id: "laptop", label: "Laptop" },
			{ id: "tv", label: "Tv" },
		],
	},
	{
		title: "STATUS",
		options: [
			{ id: "instock", label: "In Stock" },
			{ id: "promo", label: "Promo" },
			{ id: "bestseller", label: "Best Seller" },
		],
	},
];

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

function OrderSteps({ current }: Readonly<{ current: number }>) {
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

const checkoutSummary = (
	<AsideContent
		headerName={"Ringkasan"}
		Content={
			<div>
				<Summary
					rows={[
						["Subtotal", 15_000],
						["Pajak", 1000],
						["Diskon", 1000],
					]}
					total={13_000}
				/>
			</div>
		}
		Footer={<p className="text-center">Aman dan terenskripsi</p>}
	/>
);

export default function MainLayout() {
	const path = useLocation().pathname;
	const navigate = useNavigate();
	const cart = useSelector((state: RootState) => state.cart.cart);

	const panels: Record<string, { left?: ReactNode; right: ReactNode }> = {
		"/": {
			left: (
				<AsideContent
					headerName={"Filters"}
					Attribute={<ClearButton />}
					Content={
						<div>
							{FILTER_GROUPS.map((group) => (
								<section
									key={group.title}
									className="border-b border-base-border py-3"
								>
									<p className="text-sm font-semibold">{group.title}</p>
									<ul className="flex flex-col text-[15px] mt-2 w-full ml-0">
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
													className="peer-checked:text-text-h"
												>
													{option.label}
												</label>
											</li>
										))}
									</ul>
								</section>
							))}
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

							<Summary
								rows={[
									["Subtotal", 15_000],
									["Diskon", 5000],
								]}
								total={10_000}
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
		"/checkout": { left: <OrderSteps current={2} />, right: checkoutSummary },
		"/struct": { left: <OrderSteps current={3} />, right: checkoutSummary },
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
