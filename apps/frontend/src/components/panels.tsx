import {
	ArrowLeft,
	ArrowRight,
	Check,
	Image as ImageIcon,
	ShoppingCart,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch, RootState } from "../store";
import { clearCart, type CartItem } from "../store/slices/cart";
import Aside, { AsideContent, AsideFooter, AsideHeader } from "./Aside";
import FilterSkel from "./FilterSkel";
import Button from "./ui/button";
import Separator from "./ui/separator";

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
		<div className="flex flex-col gap-3">
			<ul className="flex flex-col gap-1 text-sm">
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
			<Separator className="-mx-4" />
			<div className="flex items-center justify-between">
				<p className="font-semibold text-text-h">Total</p>
				<p className="font-semibold text-text-h">{formatRupiah(total)}</p>
			</div>
		</div>
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
		if (next.get(param) === id) {
			next.delete(param);
		} else {
			next.set(param, id);
		}
		setSearchParams(next);
	}

	function resetFilters(): void {
		const next = new URLSearchParams(searchParams);
		for (const group of filterGroups) next.delete(group.param);
		setSearchParams(next);
	}

	return (
		<Aside>
			<AsideHeader title="Filter">
				<Button
					onClick={resetFilters}
					variant={"inverse"}
					size="sm"
				>
					Reset
				</Button>
			</AsideHeader>
			<AsideContent>
				<div>
					{loading ? (
						<FilterSkel count={4} />
					) : (
						<div className="flex flex-col gap-2">
							{filterGroups.map((group, index) => (
								<section
									key={group.title}
									className="flex flex-col gap-1"
								>
									<p className="text-xs font-semibold text-text-h">
										{group.title}
									</p>
									<div className="flex flex-col">
										{group?.options?.map((option) => {
											const active =
												searchParams.get(group.param) === option.id;
											return (
												<button
													key={option.id}
													type="button"
													onClick={() => chooseFilter(group.param, option.id)}
													aria-pressed={active}
													className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors ${
														active
															? "bg-primary/10 font-medium text-primary"
															: "text-text hover:bg-base hover:text-text-h"
													}`}
												>
													<span
														className={`centerized size-3.5 shrink-0 rounded-[4px] border transition-colors ${
															active
																? "border-primary bg-primary text-white"
																: "border-base-border"
														}`}
													>
														{active && (
															<Check
																size={9}
																strokeWidth={3.5}
															/>
														)}
													</span>
													<span className="min-w-0 flex-1 truncate">
														{option.name}
													</span>
												</button>
											);
										})}
									</div>
									{index < filterGroups.length - 1 && (
										<Separator className="-mx-4" />
									)}
								</section>
							))}
						</div>
					)}
				</div>
			</AsideContent>
		</Aside>
	);
}

export function CartPanel() {
	const cart = useSelector((state: RootState) => state.cart.cart);
	const itemCount = cart.reduce((total, item) => total + item.qty, 0);

	return (
		<Aside>
			<AsideHeader title="Keranjang">{itemCount} item</AsideHeader>
			<AsideContent>
				{cart.length > 0 ? (
					<div className="flex flex-col gap-3">
						{cart.map((item) => (
							<div
								key={item.id}
								className="flex gap-3"
							>
								<div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-base-border bg-base">
									{item.image ? (
										<img
											src={item.image}
											alt={item.alt}
											className="size-full object-cover"
										/>
									) : (
										<div className="centerized size-full text-base-border">
											<ImageIcon
												size={16}
												strokeWidth={1.5}
											/>
										</div>
									)}
									<div className="centerized absolute right-0 bottom-0 min-w-5 rounded-tl-md bg-primary px-1.5 py-0.5 text-4xs font-bold text-white">
										{item.qty}
									</div>
								</div>
								<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
									<p className="truncate text-sm font-medium text-text-h">
										{item.name}
									</p>
									{(item.color || item.specs) && (
										<p className="truncate text-xs text-text">
											{[item.color, item.specs].filter(Boolean).join(" • ")}
										</p>
									)}
									<p className="text-sm font-semibold text-text-h">
										{formatRupiah(item.total)}
									</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="centerized flex flex-col gap-2 py-16 text-center">
						<div className="centerized size-12 rounded-full bg-base text-text">
							<ShoppingCart
								size={20}
								strokeWidth={2}
							/>
						</div>
						<div className="flex flex-col gap-0.5">
							<p className="text-sm font-medium text-text-h">
								Keranjang kosong
							</p>
							<p className="text-xs text-text">
								Tambahkan produk untuk memulai.
							</p>
						</div>
					</div>
				)}
			</AsideContent>
			<AsideFooter>
				<Summary
					rows={[["Subtotal", subtotal(cart)]] as [string, number][]}
					total={cart.length > 0 ? subtotal(cart) : 0}
				/>
			</AsideFooter>
		</Aside>
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
	return (
		<Aside>
			<AsideHeader title="Proses Pesanan">
				<p className="text-xs font-semibold whitespace-nowrap text-primary">
					Langkah {current}/{ORDER_STEPS.length}
				</p>
			</AsideHeader>
			<AsideContent>
				<div>
					<section className="flex">
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
			</AsideContent>
		</Aside>
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
		<Aside>
			<AsideHeader title="Ringkasan" />
			<AsideContent>
				<div>
					<Summary
						rows={[["Subtotal", subtotal(cart)]] as [string, number][]}
						total={cart.length > 0 ? subtotal(cart) : 0}
					/>
				</div>
			</AsideContent>
			<AsideFooter>
				<p className="text-center text-xs">Aman dan terenkripsi</p>
			</AsideFooter>
		</Aside>
	);
}

export function StructSummary() {
	const location = useLocation();
	const summary = location.state?.checkout?.summary;
	const rows: [string, number][] = summary
		? [
				["Subtotal", Number(summary.subtotal)],
				["Diskon", Number(summary.discount_amount)],
				["Pajak", Number(summary.tax_amount)],
			]
		: [];

	return (
		<Aside>
			<AsideHeader title="Ringkasan" />
			<AsideContent>
				{summary ? (
					<Summary
						rows={rows}
						total={Number(summary.total_amount)}
					/>
				) : (
					<p className="text-sm">Tidak ada data transaksi.</p>
				)}
			</AsideContent>
			<AsideFooter>
				<p className="text-center text-xs">Aman dan terenkripsi</p>
			</AsideFooter>
		</Aside>
	);
}

interface BottomBarProps {
	start: ReactNode;
	caption: string;
	total: number;
	action: ReactNode;
}

function BottomBar({
	start,
	caption,
	total,
	action,
}: Readonly<BottomBarProps>) {
	return (
		<footer className="flex items-center justify-between border-t border-base-border bg-surface px-4 py-3">
			<div className="text-sm">{start}</div>
			<div className="flex items-center gap-4">
				<div className="flex flex-col text-right">
					<p className="text-xl font-semibold text-text-h">
						{formatRupiah(total)}
					</p>
					<p className="text-xs">{caption}</p>
				</div>
				{action}
			</div>
		</footer>
	);
}

export function BrowseBar() {
	const navigate = useNavigate();
	const cart = useSelector((state: RootState) => state.cart.cart);
	const qty = cart.reduce((total, item) => total + item.qty, 0);

	return (
		<BottomBar
			start={`${qty} item di keranjang`}
			caption="Subtotal"
			total={subtotal(cart)}
			action={
				<Button
					onClick={() => navigate("/checkout")}
					disabled={cart.length === 0}
				>
					Lanjut ke Pembayaran
					<ArrowRight size={15} />
				</Button>
			}
		/>
	);
}

export function CheckoutBar() {
	const navigate = useNavigate();
	const cart = useSelector((state: RootState) => state.cart.cart);
	const submitting = useSelector((state: RootState) => state.cart.submitting);

	return (
		<BottomBar
			start={
				<Button
					variant="outline"
					disabled={submitting}
					onClick={() => navigate("/")}
				>
					<ArrowLeft size={15} />
					Kembali ke Keranjang
				</Button>
			}
			caption={submitting ? "Memproses pembayaran" : "Total bayar"}
			total={subtotal(cart)}
			action={
				<Button
					type="submit"
					form="checkout"
					disabled={cart.length === 0 || submitting}
				>
					{submitting ? "Memproses..." : "Bayar Sekarang"}
					<ArrowRight size={15} />
				</Button>
			}
		/>
	);
}

export function StructBar() {
	const navigate = useNavigate();
	const location = useLocation();
	const total = Number(location.state?.checkout?.summary?.total_amount ?? 0);

	return (
		<BottomBar
			start={
				<Button
					variant="outline"
					onClick={() => window.print()}
				>
					Cetak Ulang Struk
				</Button>
			}
			caption="Total dibayar"
			total={total}
			action={
				<Button onClick={() => navigate("/")}>
					Pesanan Baru
					<ArrowRight size={15} />
				</Button>
			}
		/>
	);
}
