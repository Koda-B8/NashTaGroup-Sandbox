import ProductCard, { ProductGrid } from "./ProductCard";
import Button from "./ui/button";

export default function CardSkel({ count }: Readonly<{ count: number }>) {
	return (
		<ProductGrid>
			{Array.from({ length: count }).map((_, index) => (
				<ProductCard
					key={index}
					mediaClassName="animate-pulse"
				>
					<div className="mb-1 block h-5 w-20 animate-pulse rounded-lg bg-base"></div>
					<div className="block h-5 w-40 animate-pulse rounded-lg bg-base"></div>
					<div className="mt-1 flex items-center justify-between">
						<div className="h-6 w-30 animate-pulse rounded-lg bg-base"></div>
						<Button className="animate-pulse cursor-pointer bg-base! px-7"></Button>
					</div>
				</ProductCard>
			))}
		</ProductGrid>
	);
}
