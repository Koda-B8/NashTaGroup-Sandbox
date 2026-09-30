import { Check, Printer } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import Button from "../components/ui/button";
import Card from "../components/ui/card";
import { APP_NAME } from "../libs/app";
import { formatRupiah } from "../libs/formatRupiah";

interface CheckoutItem {
	product_item_id: string;
	product_name: string;
	product_code: string;
	unit_price: string;
	qty: number;
	subtotal: string;
}

interface CheckoutSummary {
	subtotal: string;
	discount_amount: string;
	tax_amount: string;
	total_amount: string;
}

interface CheckoutPayment {
	method: string;
	payment_reference: string | null;
	amount: string;
	paid_amount: string;
	change_amount: string;
	status: string;
	paid_at: string | null;
}

interface Checkout {
	transaction_number: string;
	status: string;
	cashier: { id: string; fullname: string };
	customer: { id: string; name: string | null; phone: string } | null;
	items: CheckoutItem[];
	summary: CheckoutSummary;
	payment: CheckoutPayment;
	created_at: string;
}

function formatDateTime(value: string | null | undefined): string {
	if (!value) return "-";
	return new Date(value).toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function ReceiptRow({
	label,
	value,
	strong,
}: Readonly<{ label: string; value: string; strong?: boolean }>) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className={strong ? "font-semibold text-text-h" : "text-text"}>
				{label}
			</span>
			<span
				className={
					strong ? "font-semibold text-text-h" : "font-medium text-text-h"
				}
			>
				{value}
			</span>
		</div>
	);
}

function ReceiptField({
	label,
	value,
}: Readonly<{ label: string; value: string }>) {
	return (
		<div className="flex min-w-40 flex-1 flex-col gap-0.5">
			<p className="text-2xs text-text">{label}</p>
			<p className="text-sm font-medium text-text-h">{value}</p>
		</div>
	);
}

export default function StructStatus() {
	const location = useLocation();
	const navigate = useNavigate();
	const checkout: Checkout | undefined = location.state?.checkout;

	useEffect(() => {
		if (!checkout) navigate("/");
	}, [checkout, navigate]);

	if (!checkout) return null;

	const summary = checkout.summary;
	const payment = checkout.payment;

	return (
		<div className="flex w-full flex-col gap-3 px-3 print:mx-auto print:max-w-sm print:p-6">
			<Card
				padding="md"
				className="flex items-center gap-4 print:hidden"
			>
				<div className="centerized size-11 shrink-0 rounded-full border border-deep-valid bg-valid">
					<Check
						size={20}
						className="text-deep-valid"
					/>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<p className="text-sm font-semibold text-text-h">
						Pembayaran Berhasil
					</p>
					<p className="truncate text-xs text-text">
						#{checkout.transaction_number} •{" "}
						{formatDateTime(checkout.created_at)} • Kasir:{" "}
						{checkout.cashier?.fullname}
					</p>
				</div>
				<div className="hidden shrink-0 flex-col items-end gap-0.5 text-right sm:flex">
					<p className="text-2xs text-text">Total dibayar</p>
					<p className="font-semibold text-base text-text-h">
						{formatRupiah(Number(summary?.total_amount))}
					</p>
				</div>
				<Button
					variant="primary"
					className="shrink-0"
					onClick={() => window.print()}
				>
					<Printer size={15} />
					Cetak Struk
				</Button>
			</Card>

			<Card
				padding="md"
				className="print:rounded-none print:border-0 print:p-0"
			>
				<header className="flex flex-wrap items-start justify-between gap-4 border-b border-base-border pb-4">
					<div className="flex flex-col gap-0.5">
						<h6 className="font-semibold text-base text-text-h">{APP_NAME}</h6>
						<p className="text-xs text-text">
							Jl. Melati No.12, Malang • 0812-3456-7890
						</p>
					</div>
					<div className="flex flex-col items-end gap-0.5 text-right">
						<p className="text-sm font-semibold text-text-h">
							#{checkout.transaction_number}
						</p>
						<p className="text-xs text-text">
							{formatDateTime(checkout.created_at)}
						</p>
					</div>
				</header>

				<section className="flex flex-wrap gap-x-8 gap-y-3 border-b border-base-border py-4">
					<ReceiptField
						label="Kasir"
						value={checkout.cashier?.fullname ?? "-"}
					/>
					<ReceiptField
						label="Pelanggan"
						value={checkout.customer?.phone ?? "Non-member"}
					/>
					<ReceiptField
						label="Pembayaran"
						value={payment?.method ?? "-"}
					/>
					<ReceiptField
						label="Status"
						value="Lunas"
					/>
				</section>

				<section className="border-b border-base-border py-2">
					<table className="w-full">
						<thead>
							<tr className="text-xs text-text">
								<th className="py-2 text-left font-medium">Item</th>
								<th className="w-16 py-2 text-right font-medium">Qty</th>
								<th className="w-32 py-2 text-right font-medium print:hidden">
									Harga
								</th>
								<th className="w-36 py-2 text-right font-medium">Subtotal</th>
							</tr>
						</thead>
						<tbody>
							{checkout.items?.map((item) => (
								<tr
									key={item.product_item_id}
									className="border-t border-base-border align-top"
								>
									<td className="py-3 pr-4">
										<p className="text-sm font-medium text-text-h">
											{item.product_name}
										</p>
										<p className="text-2xs text-text">{item.product_code}</p>
									</td>
									<td className="py-3 text-right text-sm text-text">
										{item.qty}
									</td>
									<td className="py-3 text-right text-sm text-text print:hidden">
										{formatRupiah(Number(item.unit_price))}
									</td>
									<td className="py-3 text-right text-sm font-semibold text-text-h">
										{formatRupiah(Number(item.subtotal))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>

				<section className="flex justify-end border-b border-base-border py-4">
					<div className="flex w-full max-w-xs flex-col gap-1 text-sm print:max-w-none">
						<ReceiptRow
							label="Subtotal"
							value={formatRupiah(Number(summary?.subtotal))}
						/>
						{Number(summary?.discount_amount) > 0 && (
							<ReceiptRow
								label="Diskon"
								value={`-${formatRupiah(Number(summary.discount_amount))}`}
							/>
						)}
						{Number(summary?.tax_amount) > 0 && (
							<ReceiptRow
								label="Pajak"
								value={formatRupiah(Number(summary.tax_amount))}
							/>
						)}
						<ReceiptRow
							label="Total"
							value={formatRupiah(Number(summary?.total_amount))}
							strong
						/>
						<ReceiptRow
							label={payment?.method ?? "Dibayar"}
							value={formatRupiah(Number(payment?.paid_amount))}
						/>
						<ReceiptRow
							label="Kembalian"
							value={formatRupiah(Number(payment?.change_amount))}
						/>
					</div>
				</section>

				<footer className="flex flex-col items-center gap-1 pt-4 text-center">
					<p className="text-sm font-medium text-text-h">
						Terima kasih — Sampai jumpa lagi!
					</p>
					<p className="text-2xs text-text">
						Struk ini merupakan bukti pembayaran yang sah
					</p>
				</footer>
			</Card>
		</div>
	);
}
