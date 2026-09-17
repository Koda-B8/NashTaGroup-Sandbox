import {
	QrCode,
	Wallet,
	CreditCard,
	Minus,
	Plus,
	SquareArrowRightEnter,
	CircleCheckBig,
	RotateCw,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import Button from "../components/ui/button";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch, RootState } from "../store";
import { incrementItem, decrementItem, clearCart } from "../store/slices/cart";

interface PaymentMethod {
	id: number;
	name: string;
	desc: string;
	icon: ReactNode;
}

export default function Checkout() {
	const cart = useSelector((state: RootState) => state.cart.cart);
	const dispatch = useDispatch<AppDispatch>();
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>();
	const [activeModal, setActiveModal] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const navigate = useNavigate();

	useEffect(() => {
		async function getPaymentMethod() {
			function handleIcon(name: string): ReactNode {
				switch (name) {
					case "Bank Transfer": {
						return <CreditCard size={18} />;
					}
					case "QRIS": {
						return <QrCode size={18} />;
					}
					case "Cash": {
						return <Wallet size={18} />;
					}
					default: {
						return <CreditCard size={18} />;
					}
				}
			}

			try {
				const data = await apiFetch("/api/v1/payment-methods");
				const result = await data.json();
				const datas = result.data.map((item) => {
					return {
						...item,
						desc: "Virtual Account",
						icon: handleIcon(item.name),
					};
				});
				setPaymentMethods(datas);
			} catch (error) {
				console.error(error);
			}
		}
		getPaymentMethod();
	}, []);

	function handleDecItemCart(id: string): void {
		try {
			dispatch(decrementItem({ id }));
		} catch (error) {
			console.error(error);
		}
	}

	function handleIncItemCart(id: string): void {
		try {
			dispatch(incrementItem({ id }));
		} catch (error) {
			console.error(error);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			const data = new FormData(e.target);
			const formated = Object.fromEntries(data.entries());

			const res = {
				payment_method_id: formated.Payment,
				paid_amount: cart
					.reduce((total, curr) => total + curr.price * curr.qty, 0)
					.toString(),
				items: cart.map((item) => {
					return {
						product_item_id: "c6f10de9-8005-4636-925b-6295537d0805",
						qty: item.qty,
					};
				}),
			};

			const respose = await apiFetch("/api/v1/checkout", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"Idempotency-Key": crypto.randomUUID(),
				},
				body: JSON.stringify(res),
			});

			const result = await respose.json();
			if (result.success) {
				setActiveModal(true);
				setTimeout(() => {
					setActiveModal(false);
					navigate("/struct", {
						state: {
							paymentMethod: result.data.payment.method,
							items: cart,
						},
					});
					dispatch(clearCart());
				}, 2500);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			{activeModal && (
				<div className="z-100 bg-black/30 left-0 top-0 fixed w-screen h-screen centerized">
					<div className="w-100 h-50 centerized gap-3 flex-col overflow-hidden shadow-lg z-200 bg-white rounded-lg">
						<CircleCheckBig
							size={45}
							className="text-deep-valid/70"
						/>
						<h5>Sukses Proses pesanan</h5>
					</div>
				</div>
			)}
			<form
				onSubmit={handleSubmit}
				className="w-full flex flex-col gap-2 px-3"
			>
				<header className="flex items-center justify-between">
					<div
						className="w-[84%] flex items-center text-sm h-10 bg-white rounded-md 
				pl-4 border border-base-border"
					>
						<p>Siap dibayar • Estimasi 30–45 menit</p>
					</div>
					<Button
						variant={"inverse"}
						className=" w-[15%] border border-base-border"
					>
						<p>Bantuan ?</p>
					</Button>
				</header>

				<main className="flex flex-col gap-3">
					<section className="bg-white rounded-md border border-base-border p-3">
						<header className="flex items-center justify-between">
							<h6>Pesanan {cart.length} Items</h6>
							<Button variant={"inverse"}>
								<p>Edit</p>
							</Button>
						</header>

						<main className="flex flex-col gap-3 mt-2">
							{cart.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between"
								>
									<div className="flex gap-3 w-[60%]">
										<div className="w-16 h-18 border border-base-border rounded-md bg-base">
											<img
												src={item.image ?? ""}
												alt={item.alt}
											/>
										</div>
										<div className="flex flex-col justify-center">
											<p className="text-sm text-text-h">{item.name}</p>
											<p className="text-sm">
												{formatRupiah(item.price)} • {item.qty}x
											</p>
											<div className="flex items-center gap-1">
												<p className="text-sm text-text-h">{item.color}</p>
												<p>•</p>
												<p className="text-sm text-text-h">{item.specs}</p>
											</div>
										</div>
									</div>

									<div className="w-[15%]">
										<div
											className="flex items-center justify-between w-35 h-11 
												rounded-lg border border-base-border"
										>
											<Button
												variant="inverse"
												onClick={() => {
													if (item.qty > 1) {
														handleDecItemCart(item.id);
													}
												}}
											>
												<Minus
													size={14}
													strokeWidth={3}
												/>
											</Button>
											<h6>{item.qty}</h6>
											<Button
												variant="inverse"
												onClick={() => {
													handleIncItemCart(item.id);
												}}
											>
												<Plus
													size={14}
													strokeWidth={3}
												/>
											</Button>
										</div>
									</div>

									<div className="flex w-[25] text-right items-center">
										<h6>{formatRupiah(item.total)}</h6>
									</div>
								</div>
							))}
						</main>
					</section>

					<section className="bg-white rounded-md border border-base-border p-3">
						<header className="flex items-center justify-between">
							<h6>Metode Pembayaran</h6>
						</header>

						<main className="mt-2 grid grid-cols-3 gap-3">
							{paymentMethods?.map((item) => (
								<label
									key={item.id}
									htmlFor={item.id.toString()}
									className="group h-25 flex flex-col cursor-pointer"
								>
									<input
										className="peer sr-only"
										name={"Payment"}
										value={item.id}
										id={item.id.toString()}
										type="radio"
									/>
									<div
										className="centerized h-full w-full overflow-hidden rounded-lg border 
								border-base-border peer-checked:border-primary peer-checked:bg-primary/10"
									>
										<div className="text-text-h centerized gap-2 text-center group-[:has(input:checked)]:text-primary">
											{item.icon}
											<h6 className="group-[:has(input:checked)]:text-primary">
												{item.name}
											</h6>
										</div>
									</div>
									<p className="text-sm text-center hidden mt-1">{item.desc}</p>
								</label>
							))}
						</main>
					</section>
					<section>
						<Button
							type="submit"
							disabled={loading}
							className="w-full h-14 font-semibold flex items-center"
						>
							{loading ? (
								<RotateCw
									className="animate-spin"
									size={17}
								/>
							) : (
								<div className="flex gap-2 items-center">
									<SquareArrowRightEnter
										size={17}
										strokeWidth={2.5}
									/>
									<p>Proses pesanan</p>
								</div>
							)}
						</Button>
					</section>
				</main>
			</form>
		</>
	);
}
