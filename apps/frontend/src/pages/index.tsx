import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

import Button from "../components/ui/button";
import Card from "../components/ui/card";

interface Product {
	id: string;
	image: string;
	alt: string;
	title: string;
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
		id: "1",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "2",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "3",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "4",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "5",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "6",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "7",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "8",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
	{
		id: "9",
		image: "",
		alt: "",
		title: "Example",
		price: 30_000,
		category: "Smartphone",
	},
];

export default function Home() {
	return (
		<div className="flex w-full px-3 flex-col">
			<ParamsSection />
			<div className="grid grid-cols-3 gap-3">
				{products.map((item) => (
					<Card
						key={item.id}
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
							<h6>{item.title}</h6>
							<p className="text-sm">{item.category}</p>

							<div className="flex items-center justify-between mt-1">
								<h5>Rp.{item.price}</h5>
								<Button className="px-7 cursor-pointer">
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
