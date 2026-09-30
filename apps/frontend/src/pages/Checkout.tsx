import {
	Check,
	CreditCard,
	Minus,
	Phone,
	Plus,
	QrCode,
	Trash,
	Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Modal from "../components/ui/modal";
import Toast from "../components/ui/toast";
import { useFlash } from "../hooks/useFlash";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch, RootState } from "../store";
import {
	clearCart,
	decrementItem,
	deleteCartItem,
	incrementItem,
	setSubmitting,
} from "../store/slices/cart";

interface PaymentMethod {
	id: string;
	name: string;
	type: string;
	admin_fee: string;
	desc: string;
	icon: ReactNode;
}

const PHONE_PATTERN = /^\+?\d{8,30}$/;

function normalizePhone(value: string): string {
	return value.trim().replaceAll(/[()\s-]/g, "");
}

function paymentDescription(type: string): string {
	switch (type) {
		case "cash": {
			return "Tunai";
		}
		case "qris": {
			return "Scan QRIS";
		}
		case "transfer": {
			return "Virtual Account";
		}
		case "debit": {
			return "Kartu Debit";
		}
		default: {
			return "Pembayaran";
		}
	}
}

function paymentIcon(type: string): ReactNode {
	switch (type) {
		case "qris": {
			return <QrCode size={18} />;
		}
		case "cash": {
			return <Wallet size={18} />;
		}
		default: {
			return <CreditCard size={18} />;
		}
	}
}

async function resolveCustomerField(
	normalizedPhone: string,
): Promise<Record<string, unknown>> {
	if (!normalizedPhone) return {};
	try {
		const response = await apiFetch(
			`/api/v1/customers?q=${encodeURIComponent(normalizedPhone)}&limit=5`,
		);
		if (response.ok) {
			const result = await response.json();
			const match = (result?.data ?? []).find(
				(customer) => customer.phone === normalizedPhone,
			);
			if (match) return { customer_phone: normalizedPhone };
		}
	} catch (error) {
		console.error(error);
	}
	return { customer: { phone: normalizedPhone } };
}

// crypto.randomUUID is only exposed in secure contexts; the POS may run over plain HTTP on the LAN.
function newIdempotencyKey(): string {
	if (crypto.randomUUID) return crypto.randomUUID();
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 0x0F) | 0x40;
	bytes[8] = (bytes[8] & 0x3F) | 0x80;
	const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
	return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

export default function Checkout() {
	const cart = useSelector((state: RootState) => state.cart.cart);
	const submitting = useSelector((state: RootState) => state.cart.submitting);
	const dispatch = useDispatch<AppDispatch>();
	const { flash, show, clear } = useFlash(3500);
	const navigate = useNavigate();

	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
	const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
	const [phone, setPhone] = useState<string>("");
	const [activeModal, setActiveModal] = useState<boolean>(false);
	const [activeCashModal, setActiveCashModal] = useState<boolean>(false);
	const [cashAmount, setCashAmount] = useState<string>("");

	const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
	const selectedMethod = paymentMethods.find(
		(method) => method.id === selectedPaymentId,
	);
	const isCash = selectedMethod?.type === "cash";
	const change = isCash ? Number(cashAmount || 0) - total : 0;
	const quickAmounts = [
		...new Set([
			total,
			...[5e4, 1e5, 5e5, 1e6, 5e6].map(
				(step) => Math.ceil(total / step) * step,
			),
		]),
	].slice(0, 4);

	useEffect(() => {
		async function getPaymentMethod() {
			try {
				const response = await apiFetch("/api/v1/payment-methods");
				const result = await response.json();
				setPaymentMethods(
					(result.data ?? []).map((item) => ({
						...item,
						desc: paymentDescription(item.type),
						icon: paymentIcon(item.type),
					})),
				);
			} catch (error) {
				console.error(error);
				show("Gagal memuat metode pembayaran.", "error");
			}
		}
		getPaymentMethod();
	}, [show]);

	function handleDecItemCart(id: string): void {
		dispatch(decrementItem({ id }));
	}

	function handleIncItemCart(id: string): void {
		dispatch(incrementItem({ id }));
	}

	function selectPaymentMethod(method: PaymentMethod): void {
		setSelectedPaymentId(method.id);
		if (method.type === "cash") {
			setActiveCashModal(true);
		} else {
			setCashAmount("");
		}
	}

	function takeCash(e): void {
		e.preventDefault();
		const parsed = Number(cashAmount);
		if (!cashAmount || !Number.isFinite(parsed) || parsed <= 0) {
			show("Masukkan jumlah uang tunai yang valid.", "error");
			return;
		}
		setCashAmount(String(parsed));
		setActiveCashModal(false);
	}

	async function handleSubmit(e): Promise<void> {
		e.preventDefault();
		if (submitting) return;

		if (cart.length === 0) {
			show("Keranjang kosong.", "error");
			return;
		}
		if (!selectedPaymentId) {
			show("Pilih metode pembayaran dulu.", "error");
			return;
		}

		const normalizedPhone = normalizePhone(phone);
		if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
			show("Nomor telepon pelanggan tidak valid.", "error");
			return;
		}

		let paidAmount = total;
		if (isCash) {
			const cash = Number(cashAmount);
			if (!cashAmount || !Number.isFinite(cash) || cash < total) {
				show("Uang tunai kurang dari total bayar.", "error");
				return;
			}
			paidAmount = cash;
		}

		dispatch(setSubmitting(true));
		try {
			const customerField = await resolveCustomerField(normalizedPhone);
			const body = {
				...customerField,
				payment_method_id: selectedPaymentId,
				paid_amount: paidAmount.toFixed(2),
				items: cart.map((item) => ({
					product_item_id: item.productItemId,
					qty: item.qty,
				})),
			};

			const response = await apiFetch("/api/v1/checkout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Idempotency-Key": newIdempotencyKey(),
				},
				body: JSON.stringify(body),
			});

			const result = await response.json().catch(() => ({}));

			if (response.ok && result.success) {
				setActiveModal(true);
				const checkout = result.data;
				setTimeout(() => {
					setActiveModal(false);
					dispatch(clearCart());
					navigate("/struct", { state: { checkout } });
				}, 1500);
			} else {
				show(
					result?.message ?? result?.error ?? "Checkout gagal. Coba lagi.",
					"error",
				);
			}
		} catch (error) {
			console.error(error);
			show("Terjadi kesalahan. Coba lagi.", "error");
		} finally {
			dispatch(setSubmitting(false));
		}
	}

	return (
		<>
			<Modal
				open={activeCashModal}
				onOpenChange={setActiveCashModal}
				size="md"
				title="Pembayaran Tunai"
			>
				<form
					onSubmit={takeCash}
					className="flex flex-col gap-4"
				>
					<div className="flex items-center justify-between rounded-lg bg-base px-4 py-3">
						<p className="text-sm text-text">Total bayar</p>
						<p className="text-lg font-semibold text-text-h">
							{formatRupiah(total)}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="cash"
							className="text-sm font-medium text-text-h"
						>
							Uang diterima
						</label>
						<Input
							id="cash"
							name="cash"
							type="number"
							min="0"
							step="any"
							placeholder="0"
							value={cashAmount}
							onChange={(event) => setCashAmount(event.target.value)}
							className="text-lg font-semibold"
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						{quickAmounts.map((amount) => (
							<button
								key={amount}
								type="button"
								onClick={() => setCashAmount(String(amount))}
								className="rounded-full border border-base-border bg-surface px-3 py-1 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:text-text-h"
							>
								{amount === total ? "Uang pas" : formatRupiah(amount)}
							</button>
						))}
					</div>

					<div className="flex items-center justify-between rounded-lg border border-base-border px-4 py-2.5">
						<p className="text-sm text-text">Kembalian</p>
						<p
							className={`text-sm font-semibold ${
								change < 0 ? "text-deep-danger" : "text-text-h"
							}`}
						>
							{cashAmount
								? change < 0
									? `Kurang ${formatRupiah(-change)}`
									: formatRupiah(change)
								: "-"}
						</p>
					</div>

					<Button
						variant="primary"
						block
						type="submit"
					>
						Lanjutkan
					</Button>
				</form>
			</Modal>

			<Modal
				open={activeModal}
				onOpenChange={setActiveModal}
				size="sm"
				label="Pesanan berhasil diproses"
			>
				<div className="flex flex-col items-center gap-4 py-4 text-center">
					<div className="centerized size-16 rounded-full border border-deep-valid/15 bg-valid">
						<Check
							size={30}
							strokeWidth={2.5}
							className="text-deep-valid"
						/>
					</div>
					<div className="flex flex-col gap-1">
						<p className="font-semibold text-base text-text-h">
							Pesanan berhasil diproses
						</p>
						<p className="text-xs text-text">Mengarahkan ke halaman struk…</p>
					</div>
				</div>
			</Modal>

			<form
				id="checkout"
				onSubmit={handleSubmit}
				className="flex w-full flex-col gap-2 px-3"
			>
				<Toast
					message={flash?.message}
					variant={flash?.variant}
					onDismiss={clear}
				/>

				<main className="flex flex-col gap-3 pb-7">
					<Card padding="sm">
						<header className="flex items-center justify-between">
							<h6 className="text-sm font-semibold text-text-h">
								Pesanan{" "}
								<span className="font-normal text-text">
									({cart.length} item)
								</span>
							</h6>
						</header>

						<main className="mt-2 flex flex-col gap-3">
							{cart.length === 0 && (
								<p className="py-6 text-center text-sm font-medium text-text">
									Keranjang kosong
								</p>
							)}
							{cart.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between gap-4"
								>
									<div className="flex min-w-0 flex-1 gap-3">
										<div className="h-18 w-16 shrink-0 overflow-hidden rounded-lg border border-base-border bg-base">
											{item.image && (
												<img
													src={item.image}
													alt={item.alt}
													className="size-full object-cover"
												/>
											)}
										</div>
										<div className="flex flex-col justify-center gap-0.5">
											<p className="text-sm font-medium text-text-h">
												{item.name}
											</p>
											<p className="text-xs text-text">
												{formatRupiah(item.price)} • {item.qty}×
											</p>
											{(item.color || item.specs) && (
												<p className="text-xs text-text">
													{[item.color, item.specs].filter(Boolean).join(" • ")}
												</p>
											)}
											<p className="text-2xs text-text">{item.productCode}</p>
										</div>
									</div>

									<div className="shrink-0">
										<div className="flex h-11 w-35 items-center justify-between rounded-lg border border-base-border">
											<Button
												variant="ghost"
												className="cursor-pointer"
												onClick={() => {
													if (item.qty > 1) handleDecItemCart(item.id);
												}}
											>
												<Minus
													size={14}
													strokeWidth={3}
												/>
											</Button>
											<span className="text-sm font-semibold text-text-h">
												{item.qty}
											</span>
											<Button
												variant="ghost"
												className="cursor-pointer"
												onClick={() => {
													if (item.qty < item.stock) handleIncItemCart(item.id);
												}}
											>
												<Plus
													size={14}
													strokeWidth={3}
												/>
											</Button>
										</div>
									</div>

									<div className="flex w-36 shrink-0 items-center justify-end text-right">
										<p className="text-sm font-semibold text-text-h">
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
												className="text-deep-danger"
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
						<h6 className="text-sm font-semibold text-text-h">Pelanggan</h6>
						<label
							htmlFor="phone"
							className="text-xs font-medium text-text-h"
						>
							No. Telepon
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
								type="tel"
								inputMode="tel"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								className="pl-9"
							/>
						</div>
						<p className="text-xs text-text">
							Kosongkan jika bukan member. Nomor member akan otomatis dikenali.
						</p>
					</Card>

					<Card padding="sm">
						<header className="flex items-center justify-between">
							<h6 className="text-sm font-semibold text-text-h">
								Metode Pembayaran
							</h6>
						</header>

						<main className="mt-2 grid grid-cols-4 gap-3">
							{paymentMethods.map((item) => (
								<label
									key={item.id}
									htmlFor={item.id}
									className="group flex h-25 cursor-pointer flex-col"
								>
									<input
										className="peer sr-only"
										checked={selectedPaymentId === item.id}
										onChange={() => selectPaymentMethod(item)}
										name="Payment"
										value={item.id}
										id={item.id}
										type="radio"
									/>
									<div className="centerized h-full w-full overflow-hidden rounded-lg border border-base-border peer-checked:border-primary peer-checked:bg-primary/10">
										<div className="centerized gap-2 text-center text-text-h group-[:has(input:checked)]:text-primary">
											{item.icon}
											<p className="text-sm font-semibold group-[:has(input:checked)]:text-primary">
												{item.name}
											</p>
										</div>
									</div>
									<p className="mt-1 text-center text-xs text-text">
										{item.desc}
									</p>
								</label>
							))}
						</main>

						{isCash && (
							<div className="mt-3 flex items-center justify-between rounded-lg border border-base-border bg-base px-4 py-3 text-sm">
								<div>
									<p className="text-xs text-text">Uang diterima</p>
									<p className="text-sm font-semibold text-text-h">
										{cashAmount ? formatRupiah(Number(cashAmount)) : "-"}
									</p>
								</div>
								<div className="text-right">
									<p className="text-xs text-text">Kembalian</p>
									<p className="text-sm font-semibold text-text-h">
										{cashAmount ? formatRupiah(Math.max(0, change)) : "-"}
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setActiveCashModal(true)}
								>
									Ubah
								</Button>
							</div>
						)}
					</Card>
				</main>
			</form>
		</>
	);
}
