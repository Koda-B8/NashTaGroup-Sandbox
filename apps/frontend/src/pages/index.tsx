import { Plus, ChevronLeft, ChevronRight, X, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import CardSkel from "../components/CardSkel";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Checkbox from "../components/ui/checkbox";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch } from "../store";
import { addToCart, type CartItem } from "../store/slices/cart";

interface Page {
	page: string;
}

const pages: Page[] = [
	{
		page: "1",
	},
	{
		page: "2",
	},
	{
		page: "3",
	},
];

interface Category {
	id: string;
	name: string;
	isActive: boolean;
}

interface Brand {
	id: string;
	name: string;
	isActive: boolean;
}

interface ProductItem {
	id: string;
	productCode: string;
	name: string;
	price: string;
	isActive: boolean;
}

interface Product {
	id: string;
	categoryId: string;
	brandId: string;
	name: string;
	description: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	category: Category;
	brand: Brand;
	items: ProductItem[];
}

interface Specs {
	id: string;
	name: string;
	price: number;
	stock: number;
}

const specs: Specs[] = [
	{
		id: "1",
		name: "128GB",
		price: 0,
		stock: 2,
	},
	{
		id: "2",
		name: "256GB",
		price: 1_500_000,
		stock: 12,
	},
	{
		id: "3",
		name: "512GB",
		price: 2_000_000,
		stock: 7,
	},
];

const optional: Specs[] = [
	{
		id: "1",
		name: "Apple care +2 Tahun",
		price: 700_000,
		stock: 2,
	},
	{
		id: "2",
		name: "Tempered Glass",
		price: 250_000,
		stock: 12,
	},
	{
		id: "3",
		name: "Casing Silicone",
		price: 670_000,
		stock: 0,
	},
];

export default function Home() {
	const dispatch = useDispatch<AppDispatch>();
	const [prodQty, setProdQty] = useState<number>(1);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [dataSubmit, setDataSubmit] = useState({
		id: "",
		name: "",
		image: null,
		alt: "",
		category: "",
		specs: "",
		qty: 1,
		color: "",
		price: 0,
		total: 0,
	});
	const [activeModal, setActiveModal] = useState<boolean>(false);

	function handleSubmit(e): void {
		e.preventDefault();
		try {
			const data = new FormData(e.target);
			const form = Object.fromEntries(data.entries());
			setDataSubmit({ ...dataSubmit });

			const datas: FormDataEntryValue[] = [];

			for (const obj in form) {
				if (obj.startsWith("optional ")) {
					datas.push(form[obj]);
				}
			}
			const formData: CartItem = { ...dataSubmit, options: datas };
			dispatch(addToCart(formData));
			handleModal();
		} catch (error) {
			console.error(error);
		}
	}

	function addItem(id: string) {
		try {
			const data = products.find((i) => i.id === id);
			if (!data) throw new Error("Data is unvalid");

			setDataSubmit({
				...dataSubmit,
				id,
				name: data.name,
				image: null,
				alt: "image",
				category: data?.category?.name,
				price: Number.parseInt(data.items[0].price),
				total: Number.parseInt(data.items[0].price),
			});
			handleModal();
		} catch (error) {
			console.error(error);
		}
	}

	function handleModal(): void {
		if (activeModal) {
			setActiveModal(false);
		} else setActiveModal(true);
	}

	useEffect(() => {
		async function getProduct() {
			setLoading(true);
			try {
				const data = await apiFetch("/api/v1/products");
				const res = await data.json();
				setProducts(res.data);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		}
		getProduct();
	}, []);

	return (
		<>
			{activeModal && (
				<div className="z-100 bg-black/30 left-0 top-0 fixed w-screen h-screen centerized">
					<div className="w-150 h-160 overflow-hidden shadow-lg z-200 bg-white rounded-lg">
						<form
							onSubmit={handleSubmit}
							className="w-150 h-160 overflow-y-scroll  p-4 z-200 bg-white rounded-lg"
						>
							<header className="flex flex-col gap-4 pb-4 border-b w-full border-base-border">
								<div className="flex justify-between w-full  items-start">
									<div className="flex gap-4 items-center">
										<section className="w-30 h-35 rounded-lg bg-base"></section>
										<section className="flex gap-1 flex-col justify-center">
											<h6>{dataSubmit.name || "iPhone"}</h6>
											<p>{dataSubmit.category} | Ready stock</p>
											<h6 className="text-primary">
												{formatRupiah(dataSubmit.price)}
											</h6>
										</section>
									</div>
									<div>
										<Button
											onClick={() => setActiveModal(false)}
											className="rounded-full bg-base"
											variant="ghost"
										>
											<X />
										</Button>
									</div>
								</div>
								<p className="text-sm">
									Pilih variant dulu sebelum ke Keranjang
								</p>
							</header>

							<main className="flex mt-2 w-full flex-col gap-2">
								<section className="flex w-full flex-col py-3  text-sm">
									<header className="w-full flex justify-between text-[12px] items-center h-fit">
										<p className="font-semibold">
											<span className="border-l-5 border-primary mr-3 rounded-lg bg-primary"></span>{" "}
											Warna
										</p>
										<p className="text-primary">Wajib dipilih</p>
									</header>
									<main className="flex gap-3 flex-wrap mt-2">
										<div>
											<label
												htmlFor="color-blue"
												className="w-fit h-fit flex flex-col items-center gap-2"
											>
												<input
													type="radio"
													id="color-blue"
													value={"Blue"}
													onChange={() =>
														setDataSubmit({ ...dataSubmit, color: "Blue" })
													}
													name="color"
													className="peer hidden"
												/>
												<div className="w-13.5 h-13.5 centerized border border-white peer-checked:border-primary rounded-full">
													<div className="w-10 rounded-full h-10 px-4 bg-primary"></div>
												</div>
												<p className="peer-checked:text-primary text-xs font-semibold">
													Biru
												</p>
											</label>
										</div>

										<div>
											<label
												htmlFor="color-gray"
												className="w-fit h-fit flex flex-col items-center gap-2"
											>
												<input
													type="radio"
													value={"Gray"}
													name="color"
													onChange={() =>
														setDataSubmit({ ...dataSubmit, color: "Gray" })
													}
													id="color-gray"
													className="peer hidden"
												/>
												<div className="w-13.5 h-13.5 centerized border border-white peer-checked:border-primary rounded-full">
													<div className="w-10 rounded-full h-10 px-4 bg-gray-400"></div>
												</div>
												<p className="peer-checked:text-primary font-semibold text-xs">
													Gray
												</p>
											</label>
										</div>
									</main>
								</section>

								<section className="flex w-full flex-col py-3  text-sm">
									<header className="w-full flex justify-between text-[12px] items-center h-fit">
										<p className="font-semibold">
											<span className="border-l-5 border-primary mr-3 rounded-lg bg-primary"></span>
											Kapasitas
										</p>
										<p className="text-primary">Wajib dipilih</p>
									</header>

									<main className="flex gap-3 flex-wrap mt-2">
										{specs.map((item) => (
											<label
												key={item.id}
												htmlFor={item.id.toString()}
												className="group h-22 w-37 flex text-white flex-col cursor-pointer"
											>
												<input
													className="peer sr-only"
													name="specs"
													onChange={(e) => {
														if (e) {
															setDataSubmit((prev) => {
																return {
																	...prev,
																	specs: item.name,
																	total: prev.total + item.price,
																};
															});
														} else {
															setDataSubmit((prev) => {
																return {
																	...prev,
																	total: prev.total - item.price,
																};
															});
														}
													}}
													value={item.name}
													id={item.id.toString()}
													type="radio"
												/>
												<p className="hidden">.</p>
												<div className="centerized h-full w-full overflow-hidden rounded-lg border border-base-border peer-checked:border-primary peer-checked:bg-primary/10">
													<div className="text-text-h flex-col centerized gap-1 text-center group-[:has(input:checked)]:text-primary">
														<h6 className="font-semibold group-[:has(input:checked)]:text-primary">
															{item.name}
														</h6>
														<p className="text-sm text-primary">
															+{formatRupiah(item.price)}
														</p>
														<p className="text-xs text-text group-[:has(input:checked)]:text-deep-danger/80">
															Stok {item.stock}
														</p>
													</div>
												</div>
											</label>
										))}
									</main>
								</section>

								<section className="flex w-full flex-col py-3  text-sm">
									<header className="w-full flex justify-between text-[12px] items-center h-fit">
										<p className="font-semibold">
											<span className="border-l-5 border-primary mr-3 rounded-lg bg-primary"></span>
											Kapasitas
										</p>
										<p className="text-primary">Optional</p>
									</header>

									<main className="flex gap-3 flex-col flex-wrap mt-2">
										{optional.map((item, index) => (
											<label
												key={item.id}
												htmlFor={`opt${item.id.toString()}`}
												className="group h-14 w-full flex flex-col cursor-pointer"
											>
												<p className="hidden">.</p>
												<div
													className="centerized h-full w-full overflow-hidden rounded-lg border border-base-border 
											peer-checked:border-primary group-[:has(input:checked)]:border-primary peer-checked:bg-primary/10"
												>
													<div
														className="text-text-h flex w-full px-3 items-center justify-between gap-1 text-center 
												group-[:has(input:checked)]:text-primary"
													>
														<div className="flex w-[50%] items-center gap-2">
															<Checkbox
																name={`optional ${index + 1}`}
																value={item.name}
																onCheckedChange={(e) => {
																	if (e) {
																		setDataSubmit((prev) => {
																			return {
																				...prev,
																				total: prev.total + item.price,
																			};
																		});
																	} else {
																		setDataSubmit((prev) => {
																			return {
																				...prev,
																				total: prev.total - item.price,
																			};
																		});
																	}
																}}
																disabled={item.stock < 1}
																id={`opt${item.id.toString()}`}
																className="peer group"
															/>
															<h6 className="font-semibold group-[:has(input:checked)]:text-primary">
																{item.name}
															</h6>
														</div>
														<div className="w-[20%] centerized">
															<p
																className={`${item.stock > 0 ? "text-text-h" : "text-deep-danger/80"} px-3 text-xs font-semibold py-1.5 rounded-lg bg-base`}
															>
																{item.stock > 0
																	? `Stok ${item.stock}`
																	: "Habis"}
															</p>
														</div>
														<p className="text-sm w-[30%] text-right text-primary">
															+{formatRupiah(item.price)}
														</p>
													</div>
												</div>
											</label>
										))}
									</main>
									<footer className="flex mt-10 flex-col gap-3">
										<div
											className="w-full p-4 text-left bg-base border border-base-border rounded-lg 
									gap-1 h-17 flex flex-col justify-center"
										>
											<p className="text-xs">KOMBINASI TERPILIH</p>
											<div className="flex items-center gap-2">
												<h6>{dataSubmit?.color}</h6>
												<h6>{dataSubmit?.specs}</h6>
											</div>
										</div>
										<div className="flex justify-between items-center">
											<div className="flex gap-4 items-center">
												<div
													className="flex items-center justify-between w-35 h-11
											rounded-lg border border-base-border"
												>
													<Button
														variant="inverse"
														onClick={() => {
															if (prodQty > 1) {
																setDataSubmit((prev) => {
																	return {
																		...prev,
																		total: prev.total - prev.price,
																		qty: prev.qty - 1,
																	};
																});
																setProdQty((prev) => prev - 1);
															}
														}}
													>
														<Minus
															size={14}
															strokeWidth={3}
														/>
													</Button>
													<h6>{prodQty}</h6>
													<Button
														variant="inverse"
														onClick={() => {
															setDataSubmit((prev) => {
																return {
																	...prev,
																	total: prev.total + prev.price,
																	qty: prev.qty + 1,
																};
															});
															setProdQty((prev) => prev + 1);
														}}
													>
														<Plus
															size={14}
															strokeWidth={3}
														/>
													</Button>
												</div>
												<h5>{formatRupiah(dataSubmit.total)}</h5>
											</div>
											<Button
												variant="primary"
												type="submit"
											>
												<p>Tambah Ke Keranjang</p>
											</Button>
										</div>
									</footer>
								</section>
							</main>
						</form>
					</div>
				</div>
			)}
			<div className="flex w-full px-3 flex-col">
				<ParamsSection />
				{loading ? (
					<CardSkel count={3} />
				) : (
					<div className="grid grid-cols-3 gap-3">
						{products?.map((item) => (
							<Card
								key={item.id}
								padding={"none"}
								className="p-1"
							>
								<header className="w-full h-45 centerized rounded-t-xl bg-base">
									{/* {item.image ? (
										<img
											src={item.image ?? item.image}
											alt={item?.alt}
										/>
									) : ( */}
									<h1 className="text-base-border!">N</h1>
									{/* )} */}
								</header>
								<main className="w-full h-25 p-2">
									<p className="text-sm">{item.brand.name}</p>
									<h6>{item.name}</h6>
									<div className="flex items-center justify-between mt-1">
										<h5>
											{formatRupiah(Number.parseInt(item.items[0]?.price))}
										</h5>
										<Button
											onClick={() => addItem(item.id)}
											className="rounded-full  cursor-pointer"
										>
											<Plus
												strokeWidth={5}
												size={14}
											/>
										</Button>
									</div>
								</main>
							</Card>
						))}
					</div>
				)}
				<Pagination products={products} />
			</div>
		</>
	);
}

function ParamsSection() {
	return (
		<div className="flex w-full items-center justify-between py-3">
			<form
				action=""
				className="w-full flex justify-between"
			>
				<input
					type="text"
					placeholder="Search Products.."
					className="bg-white outline-none pl-3 text-sm rounded-md border 
					border-base-border w-70 h-10"
				/>

				<select
					className="w-40 text-sm outline-none pl-2 h-10 rounded-md bg-white 
					border border-base-border"
					name="sort"
					id="sort"
				>
					<option value="popular">Popular</option>
				</select>
			</form>
		</div>
	);
}

function Pagination({ products }) {
	return (
		<div className="flex mt-12 mb-5 items-center w-full justify-between">
			<p className="text-sm">Showing {products?.length} of 120 products</p>

			<div className="flex items-center gap-2">
				<Button
					disabled={true}
					size={"sm"}
					variant={"inverse"}
				>
					<ChevronLeft size={15} />
				</Button>
				{pages.map((item) => (
					<Button
						size={"sm"}
						variant={item.page === "1" ? "primary" : "inverse"}
						key={item.page}
					>
						<p>{item.page}</p>
					</Button>
				))}
				<Button
					size={"sm"}
					variant={"inverse"}
				>
					<ChevronRight size={15} />
				</Button>
			</div>
		</div>
	);
}
