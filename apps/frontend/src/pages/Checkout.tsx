import {
	QrCode,
	Wallet,
	CreditCard,
	Minus,
	Plus,
	SquareArrowRightEnter,
	CircleCheckBig,
	RotateCw,
	Trash,
	Phone,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import OrderStatusBar from "../components/OrderStatusBar";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Modal from "../components/ui/modal";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch, RootState } from "../store";
import {
	incrementItem,
	decrementItem,
	clearCart,
	deleteCartItem,
} from "../store/slices/cart";

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

			console.log(cart);

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
							phone: formated.phone,
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
			<Modal
				open={activeModal}
				onOpenChange={setActiveModal}
				size="sm"
				label="Sukses Proses pesanan"
			>
				<div className="centerized h-50 flex-col gap-3">
					<CircleCheckBig
						size={45}
						className="text-deep-valid/70"
					/>
					<p className="text-xl font-semibold text-text-h">
						Sukses Proses pesanan
					</p>
				</div>
			</Modal>
			<form
				onSubmit={handleSubmit}
				className="flex w-full flex-col gap-2 px-3"
			>
				<OrderStatusBar />

				<main className="flex flex-col gap-3 pb-7">
					<Card padding="sm">
						<header className="flex items-center justify-between">
							<h6 className="text-sm font-semibold text-text-h">
								Pesanan {cart.length} Items
							</h6>
						</header>

						<main className="mt-2 flex flex-col gap-3">
							{cart.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between"
								>
									<div className="flex min-w-0 flex-1 gap-3">
										<div className="h-18 w-16 rounded-lg border border-base-border bg-base">
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

									<div className="shrink-0">
										<div
											className="flex h-11 w-35 items-center justify-between 
												rounded-lg border border-base-border"
										>
											<Button
												variant="ghost"
												className="cursor-pointer"
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
											<span className="font-semibold text-text-h">
												{item.qty}
											</span>
											<Button
												variant="ghost"
												className="cursor-pointer "
												onClick={() => {
													handleIncItemCart(item.id);
												}}
											>
												<Plus
													size={14}
													className="cursor-pointer"
													strokeWidth={3}
												/>
											</Button>
										</div>
									</div>

									<div className="flex shrink-0 items-center justify-end pr-10 text-right">
										<p className="font-semibold text-text-h">
											{formatRupiah(item.total)}
										</p>
									</div>
									<div className="shrink-0">
										<Button
											variant="ghost"
											onClick={() => dispatch(deleteCartItem({ id: item.id }))}
											className="cursor-pointer rounded-lg p-2 shadow-sm"
										>
											<Trash
												size={18}
												className="text-deep-danger/70"
											/>
										</Button>
									</div>
								</div>
							))}
						</main>
					</Card>

					<Card
						padding="sm"
						className="flex w-full flex-col gap-2"
					>
						<label
							htmlFor="phone"
							className="text-xs font-medium text-text-h"
						>
							Customer Phone
						</label>
						<div className="relative">
							<Phone
								size={14}
								className="absolute top-1/2 left-3 -translate-y-1/2 text-text"
							/>
							<Input
								placeholder="08xxxx"
								id="phone"
								name="phone"
								type="number"
								className="pl-9"
							/>
						</div>
					</Card>

					<Card padding="sm">
						<header className="flex items-center justify-between">
							<h6 className="text-sm font-semibold text-text-h">
								Metode Pembayaran
							</h6>
						</header>

						<main className="mt-2 grid grid-cols-3 gap-3">
							{paymentMethods?.map((item) => (
								<label
									key={item.id}
									htmlFor={item.id.toString()}
									className="group flex h-25 cursor-pointer flex-col"
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
										<div className="centerized gap-2 text-center text-text-h group-[:has(input:checked)]:text-primary">
											{item.icon}
											<p className="font-semibold group-[:has(input:checked)]:text-primary">
												{item.name}
											</p>
										</div>
									</div>
									<p className="mt-1 hidden text-center text-sm">{item.desc}</p>
								</label>
							))}
						</main>
					</Card>

					<section>
						<Button
							type="submit"
							disabled={loading}
							className="flex h-14 w-full items-center font-semibold"
						>
							{loading ? (
								<RotateCw
									className="animate-spin"
									size={17}
								/>
							) : (
								<div className="flex items-center gap-2">
									<SquareArrowRightEnter
										size={17}
										strokeWidth={2.5}
									/>
									<p>Proses pesanan</p>
								</div>
							)}
						</Button>
					</section>
					<p className="mt-4 text-center text-xs text-text-h">NashTa Group</p>
				</main>
			</form>
		</>
	);
}
