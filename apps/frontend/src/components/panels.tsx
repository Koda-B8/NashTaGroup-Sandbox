import { ArrowRight, Check, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router";

import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch, RootState } from "../store";
import { clearCart, type CartItem } from "../store/slices/cart";
import Aside from "./Aside";
import FilterSkel from "./FilterSkel";
import Button from "./ui/button";

interface SummaryProps {
	rows: [label: string, amount: number][];
	total: number;
}

interface Category {
	id: string;
	name: string;
}

interface FilterGroup {
	title: string;
	param: string;
	options: Category[];
}

function subtotal(cart: CartItem[]): number {
	return cart.reduce((total, item) => total + item.qty * item.price, 0);
}

function Summary({ rows, total }: Readonly<SummaryProps>) {
	return (
		<>
			<section className="min-h-10 border-b border-b-base-border py-3 text-sm">
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
			<section className="flex items-center justify-between py-3">
				<p className="font-semibold text-text-h">Total</p>
				<p className="font-semibold text-text-h">{formatRupiah(total)}</p>
			</section>
		</>
	);
}

export function FiltersPanel() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [loading, setLoading] = useState<boolean>(true);
	const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

	useEffect(() => {
		async function getFilters() {
			setLoading(true);
			try {
				const [categoriesRes, brandsRes] = await Promise.all([
					apiFetch("/api/v1/categories"),
					apiFetch("/api/v1/brands"),
				]);
				const [categories, brands] = await Promise.all([
					categoriesRes.json(),
					brandsRes.json(),
				]);

				setFilterGroups([
					{ title: "Kategori", param: "categoryId", options: categories.data },
					{ title: "Brand", param: "brandId", options: brands.data },
				]);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		}
		getFilters();
	}, []);

	function chooseFilter(param: string, id: string): void {
		const next = new URLSearchParams(searchParams);
		next.set(param, id);
		setSearchParams(next);
	}

	function resetFilters(): void {
		const next = new URLSearchParams(searchParams);
		for (const group of filterGroups) next.delete(group.param);
		setSearchParams(next);
	}

	return (
		<Aside
			headerName={"Filters"}
			Attribute={
				<Button
					onClick={resetFilters}
					variant={"inverse"}
				>
					Clear
				</Button>
			}
			Content={
				<div>
					{loading ? (
						<FilterSkel count={4} />
					) : (
						<div className="max-h-[31rem] overflow-y-scroll">
							{filterGroups.map((group) => (
								<section
									key={group.title}
									className="border-b border-base-border py-3"
								>
									<p className="text-sm font-semibold">{group.title}</p>
									<ul className="mt-2 ml-0 flex w-full flex-col gap-1 text-sm">
										{group?.options?.map((option) => (
											<li
												key={option.id}
												className="flex list-outside items-center justify-start gap-2"
											>
												<input
													onChange={() => chooseFilter(group.param, option.id)}
													checked={searchParams.get(group.param) === option.id}
													type="radio"
													name={group.title}
													id={option.id}
													className="peer size-4 shrink-0 accent-primary"
												/>
												<label
													htmlFor={option.id}
													className="text-sm peer-checked:text-text-h"
												>
													{option.name}
												</label>
											</li>
										))}
									</ul>
								</section>
							))}
						</div>
					)}
				</div>
			}
			Footer={
				<div className="centerized gap-2">
					<Button
						onClick={resetFilters}
						variant={"outline"}
						className="w-full px-6"
					>
						<p>Reset</p>
					</Button>
				</div>
			}
		/>
	);
}

export function CartPanel() {
	const navigate = useNavigate();
	const cart = useSelector((state: RootState) => state.cart.cart);

	return (
		<Aside
			headerName={"Keranjang"}
			Attribute={`${cart?.length} item`}
			Content={
				<div>
					{cart?.length > 0 ? (
						<section className="min-h-2 border-b border-base-border py-2">
							<div className="flex flex-col gap-2">
								{cart?.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between"
									>
										<section className="flex items-center gap-3 py-2">
											<div className="relative size-10 rounded-lg bg-base">
												<div
													className="centerized absolute top-0 left-0 h-4 min-w-4 rounded-full
												bg-primary px-1 text-4xs font-bold text-white"
												>
													{item.qty}
												</div>
											</div>
											<div className="flex flex-col justify-center text-left">
												<p className="text-sm text-text-h">{item.name}</p>
												<p className="text-sm">{formatRupiah(item.price)}</p>
											</div>
										</section>
									</div>
								))}
							</div>
						</section>
					) : (
						<div className="centerized flex h-66  gap-2 border-b border-base-border py-2">
							<ShoppingCart
								strokeWidth={2.5}
								size={17}
							/>
							<p className="text-sm font-semibold">Keranjang Kosong</p>
						</div>
					)}

					<Summary
						rows={[
							["Subtotal", subtotal(cart)],
							["Diskon", 5000],
						]}
						total={cart.length > 0 ? subtotal(cart) - 5000 : 0}
					/>
				</div>
			}
			Footer={
				<Button
					onClick={() => navigate("/checkout")}
					className="w-full"
				>
					Checkout
					<ArrowRight size={15} />
				</Button>
			}
		/>
	);
}

const ORDER_STEPS = [
	{ title: "Keranjang", caption: "4 produk" },
	{ title: "Pembayaran", caption: "Pilih metode" },
	{ title: "Selesai", caption: "Struk dan status" },
];

interface OrderStepsProps {
	current: number;
	nextAction: () => void;
}

function OrderSteps({ current, nextAction }: Readonly<OrderStepsProps>) {
	const navigate = useNavigate();
	return (
		<Aside
			headerName={"Proses Pesanan"}
			Attribute={
				<p className="w-14 text-right text-xs font-semibold text-wrap text-primary">
					Langkah {current}/{ORDER_STEPS.length}
				</p>
			}
			Content={
				<div>
					<section className="flex py-3">
						<ul className="flex w-full cursor-pointer flex-col items-center gap-4">
							{ORDER_STEPS.map((step, index) => {
								const number = index + 1;
								return (
									<li
										key={step.title}
										className="flex w-full items-center gap-3"
									>
										{number < current ? (
											<div className="centerized size-9 rounded-full border border-primary bg-primary-light">
												<Check
													size={14}
													className="text-primary"
												/>
											</div>
										) : (
											<div
												className={`centerized size-9 rounded-full ${
													number === current
														? "border border-primary bg-primary text-white"
														: "bg-base"
												}`}
											>
												<p className="text-sm font-semibold">{number}</p>
											</div>
										)}
										<div className="flex flex-col justify-center text-left text-xs ">
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
						onClick={() => navigate("/")}
						className="w-full px-6"
					>
						Batal
					</Button>
				</div>
			}
		/>
	);
}

export function CheckoutSteps() {
	const navigate = useNavigate();

	return (
		<OrderSteps
			current={2}
			nextAction={() => navigate("/struct")}
		/>
	);
}

export function StructSteps() {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	return (
		<OrderSteps
			current={3}
			nextAction={() => {
				dispatch(clearCart());
				navigate("/");
			}}
		/>
	);
}

export function CheckoutSummary() {
	const cart = useSelector((state: RootState) => state.cart.cart);

	return (
		<Aside
			headerName={"Ringkasan"}
			Content={
				<div>
					<Summary
						rows={[
							["Subtotal", subtotal(cart)],
							["Pajak", 1000],
							["Diskon", 1000],
						]}
						total={cart.length > 0 ? subtotal(cart) - (5000 - 1000) : 0}
					/>
				</div>
			}
			Footer={<p className="text-center text-xs">Aman dan terenskripsi</p>}
		/>
	);
}
