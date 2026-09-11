import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch } from "react-redux";

import Button from "../components/ui/button";
import Card from "../components/ui/card";
import { formatRupiah } from "../libs/formatRupiah";
import { addToCart } from "../store/reducer/cart";

interface Product {
	uuid: string;
	image: null | string;
	alt: string;
	name: string;
	price: number;
	category: string;
}

interface Cart {
	uuid: string;
	image: null | string;
	alt: string;
	name: string;
	price: number;
	category: string;
}

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

const products: Product[] = [
	{
		uuid: "1",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "2",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "3",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "4",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "5",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "6",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "7",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "8",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
	{
		uuid: "9",
		image: null,
		alt: "",
		name: "Example",
		price: 100_000,
		category: "Smartphone",
	},
];

export default function Home() {
	const dispatch = useDispatch();
	function addItem(uuid: string) {
		const data: Cart | undefined = products.find((i) => i.uuid === uuid);
		if (data !== undefined) dispatch(addToCart({ ...data, qty: 1 }));
	}

	return (
		<div className="flex w-full px-3 flex-col">
			<ParamsSection />
			<div className="grid grid-cols-3 gap-3">
				{products.map((item) => (
					<Card
						key={item.uuid}
						padding={"none"}
						className="p-1"
					>
						<header className="w-full h-45 centerized rounded-t-xl bg-base">
							{item.image ? (
								<img
									src={item?.image}
									alt={item?.alt}
								/>
							) : (
								<h1 className="text-base-border!">N</h1>
							)}
						</header>
						<main className="w-full h-25 p-2">
							<h6>{item.name}</h6>
							<p className="text-sm">{item.category}</p>

							<div className="flex items-center justify-between mt-1">
								<h5>{formatRupiah(item.price)}</h5>
								<Button
									onClick={() => addItem(item.uuid)}
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
			<Pagination />
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

function Pagination() {
	return (
		<div className="flex mt-12 mb-5 items-center w-full justify-between">
			<p className="text-sm">Showing {products.length} of 120 products</p>

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
