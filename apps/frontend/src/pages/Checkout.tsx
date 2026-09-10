import { QrCode, Wallet, CreditCard } from "lucide-react";
import type { ReactNode } from "react";

import Button from "../components/ui/button";

interface Product {
	uuid: string;
	name: string;
	image: string;
	desc: string;
	alt: string;
	price: number;
	qty: number;
}

interface PaymentMethod {
	id: number;
	name: string;
	desc: string;
	icon: ReactNode;
}

const payment_method: PaymentMethod[] = [
	{
		id: 1,
		name: "Cash",
		desc: "Tunai",
		icon: <Wallet size={18} />,
	},
	{
		id: 2,
		name: "QRIS",
		desc: "Scan QR",
		icon: <QrCode size={18} />,
	},
	{
		id: 3,
		name: "Transfer",
		desc: "Virtual Account",
		icon: <CreditCard size={18} />,
	},
];

const products: Product[] = [
	{
		uuid: "1",
		name: "Smartphone",
		image: "",
		desc: "Putih",
		alt: "smartphone",
		price: 4_000_000,
		qty: 1,
	},
	{
		uuid: "2",
		name: "Smartphone",
		image: "",
		desc: "Putih",
		alt: "smartphone",
		price: 4_000_000,
		qty: 1,
	},
	{
		uuid: "3",
		name: "Smartphone",
		image: "",
		desc: "Putih",
		alt: "smartphone",
		price: 4_000_000,
		qty: 1,
	},
];

export default function Checkout() {
	return (
		<form className="w-full flex flex-col gap-2 px-3">
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
						<h6>Pesanan 3 Items</h6>
						<Button variant={"inverse"}>
							<p>Edit</p>
						</Button>
					</header>

					<main className="flex flex-col gap-3 mt-2">
						{products.map((item) => (
							<div
								key={item.uuid}
								className="flex items-center justify-between"
							>
								<div className="flex gap-3">
									<div className="w-13 h-13 border border-base-border rounded-md bg-base">
										<img
											src={item.image}
											alt={item.alt}
										/>
									</div>
									<div className="flex flex-col justify-center">
										<p className="text-sm text-text-h">{item.name}</p>
										<p className="text-sm">
											{item.desc} • {item.qty}x
										</p>
									</div>
								</div>

								<div className="flex items-center">
									<h6>Rp.{item.price}</h6>
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
						{payment_method.map((item) => (
							<label
								key={item.id}
								htmlFor={item.id.toString()}
								className="group h-25 flex flex-col cursor-pointer"
							>
								<input
									className="peer sr-only"
									name="payment"
									id={item.id.toString()}
									type="radio"
								/>
								<div className="centerized h-full w-full overflow-hidden rounded-lg border border-base-border peer-checked:border-primary peer-checked:bg-primary/10">
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
			</main>
		</form>
	);
}
