import { Plus, X, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router";

import CardSkel from "../components/CardSkel";
import PaginationControls from "../components/PaginationControls";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Checkbox from "../components/ui/checkbox";
import Input from "../components/ui/input";
import Modal from "../components/ui/modal";
import Select from "../components/ui/select";
import { apiFetch } from "../libs/api";
import { formatRupiah } from "../libs/formatRupiah";
import type { AppDispatch } from "../store";
import { addToCart, type CartItem } from "../store/slices/cart";

interface Page {
	page: number;
}

const pages: Page[] = [
	{
		page: 1,
	},
	{
		page: 2,
	},
	{
		page: 3,
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
	const [pagination, setPagination] = useState({});
	const [pageCount, setPageCount] = useState<string>("1");
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [searchParams, _] = useSearchParams();
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
	const categoryId = searchParams.get("categoryId") ?? "";
	const brandId = searchParams.get("brandId") ?? "";
	const params = new URLSearchParams();

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
			setProdQty(1);
			setActiveModal(false);
		} else {
			setProdQty(1);
			setActiveModal(true);
		}
	}

	useEffect(() => {
		async function getProduct() {
			setLoading(true);
			try {
				if (categoryId) {
					params.set("categoryId", categoryId);
				}
				if (brandId) {
					params.set("brandId", brandId);
				}
				params.set("limit", "5");
				params.set("page", pageCount);

				const searchValue = searchParams.get("search");
				if (searchValue === "") {
					params.delete("search");
				} else if (searchValue && searchValue?.length >= 3) {
					params.set("search", searchValue);
				}

				const data = await apiFetch(`/api/v1/products?${params.toString()}`);
				const res = await data.json();
				setProducts(res.data);
				setPagination(res.meta.pagination);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		}
		getProduct();
	}, [categoryId, brandId, pageCount, searchParams]);

	return (
		<>
			<Modal
				open={activeModal}
				onOpenChange={setActiveModal}
				size="xl"
				label={dataSubmit.name || "Pilih varian produk"}
			>
				<form onSubmit={handleSubmit}>
					<header className="flex w-full flex-col gap-4 border-b border-base-border pb-4">
						<div className="flex w-full items-start  justify-between">
							<div className="flex items-center gap-4">
								<section className="h-35 w-30 rounded-lg bg-base"></section>
								<section className="flex flex-col justify-center gap-1">
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
									aria-label="Close"
									variant="ghost"
									size="icon"
								>
									<X size={16} />
								</Button>
							</div>
						</div>
						<p className="text-sm">Pilih variant dulu sebelum ke Keranjang</p>
					</header>

					<main className="mt-2 flex w-full flex-col gap-2">
						<section className="flex w-full flex-col py-3  text-sm">
							<header className="flex h-fit w-full items-center justify-between text-xs">
								<p className="font-semibold">
									<span className="mr-3 rounded-lg border-l-5 border-primary bg-primary"></span>{" "}
									Warna
								</p>
								<p className="text-primary">Wajib dipilih</p>
							</header>
							<main className="mt-2 flex flex-wrap gap-3">
								<div>
									<label
										htmlFor="color-blue"
										className="flex h-fit w-fit flex-col items-center gap-2"
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
										<div
											className="centerized h-13.5 w-13.5 rounded-full border border-white 
												peer-checked:border-primary"
										>
											<div className="h-10 w-10 rounded-full bg-primary px-4"></div>
										</div>
										<p className="text-xs font-semibold peer-checked:text-primary">
											Biru
										</p>
									</label>
								</div>

								<div>
									<label
										htmlFor="color-gray"
										className="flex h-fit w-fit flex-col items-center gap-2"
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
										<div className="centerized h-13.5 w-13.5 rounded-full border border-white peer-checked:border-primary">
											<div className="h-10 w-10 rounded-full bg-gray-400 px-4"></div>
										</div>
										<p className="text-xs font-semibold peer-checked:text-primary">
											Gray
										</p>
									</label>
								</div>
							</main>
						</section>

						<section className="flex w-full flex-col py-3  text-sm">
							<header className="flex h-fit w-full items-center justify-between text-xs">
								<p className="font-semibold">
									<span className="mr-3 rounded-lg border-l-5 border-primary bg-primary"></span>
									Kapasitas
								</p>
								<p className="text-primary">Wajib dipilih</p>
							</header>

							<main className="mt-2 flex flex-wrap gap-3">
								{specs.map((item) => (
									<label
										key={item.id}
										htmlFor={item.id.toString()}
										className="group flex h-22 w-37 cursor-pointer flex-col text-white"
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
											<div className="centerized flex-col gap-1 text-center text-text-h group-[:has(input:checked)]:text-primary">
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
							<header className="flex h-fit w-full items-center justify-between text-xs">
								<p className="font-semibold">
									<span className="mr-3 rounded-lg border-l-5 border-primary bg-primary"></span>
									Tambahan
								</p>
								<p className="text-primary">Optional</p>
							</header>

							<main className="mt-2 flex flex-col flex-wrap gap-3">
								{optional.map((item, index) => (
									<label
										key={item.id}
										htmlFor={`opt${item.id.toString()}`}
										className="group flex h-14 w-full cursor-pointer flex-col"
									>
										<p className="hidden">.</p>
										<div
											className="centerized h-full w-full overflow-hidden rounded-lg border border-base-border 
											group-[:has(input:checked)]:border-primary peer-checked:border-primary peer-checked:bg-primary/10"
										>
											<div
												className="flex w-full items-center justify-between gap-1 px-3 text-center text-text-h 
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
												<div className="centerized w-[20%]">
													<p
														className={`${item.stock > 0 ? "text-text-h" : "text-deep-danger/80"} rounded-lg bg-base px-3 py-1.5 text-xs font-semibold`}
													>
														{item.stock > 0 ? `Stok ${item.stock}` : "Habis"}
													</p>
												</div>
												<p className="w-[30%] text-right text-sm text-primary">
													+{formatRupiah(item.price)}
												</p>
											</div>
										</div>
									</label>
								))}
							</main>
							<footer className="mt-10 flex flex-col gap-3">
								<div
									className="flex h-17 w-full flex-col justify-center gap-1 rounded-lg 
									border border-base-border bg-base p-4 text-left"
								>
									<p className="text-xs">KOMBINASI TERPILIH</p>
									<div className="flex items-center gap-2">
										<h6>{dataSubmit?.color}</h6>
										<h6>{dataSubmit?.specs}</h6>
									</div>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div
											className="flex h-11 w-35 items-center justify-between 
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
			</Modal>
			<div className="flex w-full flex-col px-3">
				<ParamsSection params={params} />
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
								<header className="centerized h-45 w-full rounded-t-xl bg-base">
									{/* {item.image ? (
										<img
											src={item.image ?? item.image}
											alt={item?.alt}
										/>
									) : ( */}
									<h1 className="text-base-border!">N</h1>
									{/* )} */}
								</header>
								<main className="h-25 w-full p-2">
									<p className="text-sm">{item.brand.name}</p>
									<h6>{item.name}</h6>
									<div className="mt-1 flex items-center justify-between">
										<h5>
											{formatRupiah(Number.parseInt(item.items[0]?.price))}
										</h5>
										<Button
											onClick={() => addItem(item.id)}
											className="cursor-pointer  rounded-full"
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
				{!loading && products?.length < 1 && (
					<div className="centerized h-50">
						<h1 className="">Product Not Found</h1>
					</div>
				)}
				<Pagination
					products={products}
					pagination={pagination}
					setPageCount={setPageCount}
				/>
			</div>
		</>
	);
}

const SORT_OPTIONS = [{ label: "Popular", value: "popular" }];

function ParamsSection({ params }) {
	const [searchParams, setSearchParams] = useSearchParams();

	function handleSearchProduct(e): void {
		if (e.target.value.length >= 3) {
			setSearchParams({
				search: e.target.value,
			});
		} else if (e.target.value.length === 0) {
			setSearchParams({
				search: "",
			});
		}
	}

	return (
		<div className="flex w-full items-center justify-between py-3">
			<form
				action=""
				className="flex w-full justify-between"
			>
				<Input
					type="text"
					defaultValue={searchParams.get("search") ?? ""}
					onChange={handleSearchProduct}
					placeholder="Search Products.."
					className="w-70"
				/>

				<Select
					label="Sort"
					defaultValue="popular"
					items={SORT_OPTIONS}
					className="w-40"
				/>
			</form>
		</div>
	);
}

function Pagination({ products, pagination, setPageCount }) {
	return (
		<PaginationControls
			totalLabel={`Showing ${products?.length} of ${pagination.total_items} products`}
			pageCount={pages.length}
			safePage={(pagination?.page ?? 1) - 1}
			onPageChange={(page) => setPageCount(String(page + 1))}
		/>
	);
}
