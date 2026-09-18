import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import Button from "../components/ui/button";
import { formatRupiah } from "../libs/formatRupiah";
import type { CartItem } from "../store/slices/cart";

interface StateData {
	paymentMethod: string;
	items: CartItem[];
	phone: string;
}

export default function StructStatus() {
	const location = useLocation();
	const navigate = useNavigate();
	const [stateData, setStateData] = useState<StateData>({
		paymentMethod: "",
		items: [],
		phone: "",
	});

	useEffect(() => {
		function dataState() {
			if (location.state) {
				const { paymentMethod, items, phone } = location.state;
				setStateData({
					paymentMethod,
					items,
					phone,
				});
			} else {
				navigate("/");
			}
		}
		dataState();
	}, [location]);

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
				<section className="bg-white w-full flex items-center gap-5 rounded-md border border-base-border p-5">
					<div className="w-10 h-10 rounded-full centerized bg-valid border border-deep-valid">
						<Check className="text-deep-valid" />
					</div>
					<div className="flex flex-col h-full">
						<h6>
							Pembayaran Berhasil <span>Lunas</span>
						</h6>
						<p className="text-sm">#TRX-8421</p>
						<p className="text-sm">
							{" "}
							{new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							})}{" "}
							• Kasir: Budi Santoso
						</p>
					</div>
				</section>

				<section className="bg-white rounded-md border border-base-border p-5">
					<header className="flex flex-col items-center justify-center h-15 border-b border-base-border py-2">
						<h6>NashTa Group</h6>
						<p>Jl. Melati No.12, Malang • 0812-3456-7890</p>
					</header>

					<main className="mt-2 flex flex-col gap-1">
						<section className="border-b py-3 border-base-border flex items-start justify-between">
							<div className="flex flex-col">
								<h6>#RTX-8731</h6>
								<p>No telp: {stateData?.phone}</p>
								<p>Pembayaran: {stateData?.paymentMethod}</p>
							</div>
							<div className="felx h-full ">
								<p>
									{" "}
									{new Date().toLocaleString("en-GB", {
										day: "2-digit",
										month: "short",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									})}
								</p>
							</div>
						</section>

						<section className="py-3 flex border-b border-base-border flex-col gap-3">
							{stateData.items?.map((item) => (
								<div
									key={item.id}
									className="flex justify-between items-center"
								>
									<div className="flex flex-col">
										<p className="text-text-h">{item.name}</p>
										<div className="flex items-center gap-1">
											<p className="text-sm ">{item.color}</p>
											<p className="text-xs">•</p>
											<p className="text-sm ">{item.specs}</p>
										</div>
										<p>
											{item.qty}x <span>{formatRupiah(item.price)}</span>
										</p>
									</div>
									<p className="text-text-h">
										{formatRupiah(item.price * item.qty)}
									</p>
								</div>
							))}
						</section>

						<section className="py-3 flex border-b border-base-border">
							<ul className="flex flex-col w-full">
								<li className="flex items-center justify-between">
									<p>Subtotal</p>
									<p>
										{formatRupiah(
											stateData?.items.reduce(
												(total, curr) => total + curr.total,
												0,
											),
										)}
									</p>
								</li>
								<li className="flex items-center justify-between">
									<p>Pajak 10%</p>
									<p>{formatRupiah(1000)}</p>
								</li>
								<li className="flex items-center justify-between">
									<p>Total</p>
									<p>
										{formatRupiah(
											stateData?.items.reduce(
												(total, curr) => total + curr.total,
												0,
											) - 1000,
										)}
									</p>
								</li>
								<li className="flex items-center justify-between">
									<p>Tunai</p>
									<p>{formatRupiah(100_000)}</p>
								</li>
								<li className="flex items-center justify-between">
									<p>Kembalian</p>
									<p>{formatRupiah(50_000)}</p>
								</li>
							</ul>
						</section>
						<section className="flex flex-col justify-center h-10 pt-4 items-center w-full">
							<p>Terima kasih — Sampai jumpa lagi!</p>
						</section>
					</main>
				</section>
			</main>
		</form>
	);
}
