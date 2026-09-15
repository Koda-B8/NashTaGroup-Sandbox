import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import CardSkel from "../components/CardSkel";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
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

export default function Home() {
	const dispatch = useDispatch<AppDispatch>();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	function addItem(id: string) {
		try {
			const data = products.find((i) => i.id === id);
			if (!data) throw new Error("Data is unvalid");

			const cart_item: CartItem | undefined = {
				id: data.id,
				name: data.name,
				qty: 1,
				image: null,
				alt: "image",
				price: Number.parseInt(data.items[0].price),
			};

			dispatch(addToCart(cart_item));
		} catch (error) {
			console.error(error);
		}
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
		<div className="flex w-full px-3 flex-col">
			<ParamsSection />
			{loading ? (
				<CardSkel count={3} />
			) : (
				<div className="grid grid-cols-3 gap-3">
					{products?.map((item) => (
						<Card
							key={item.items[0].id}
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
									<h5>{formatRupiah(Number.parseInt(item.items[0].price))}</h5>
									<Button
										onClick={() => addItem(item.id)}
										className="px-7 cursor-pointer"
									>
										<Plus size={14} />
										<p>Add</p>
									</Button>
								</div>
							</main>
						</Card>
					))}
				</div>
			)}
			<Pagination products={products} />
		</div>
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
