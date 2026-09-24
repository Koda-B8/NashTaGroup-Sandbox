import Button from "./ui/button";
import Card from "./ui/card";

export default function CardSkel({ count }: Readonly<{ count: number }>) {
	return (
		<div className="grid grid-cols-3 gap-3">
			{Array.from({ length: count }).map((_, index) => (
				<Card
					key={index}
					padding={"none"}
					className="p-1"
				>
					<header className="centerized h-45 w-full animate-pulse rounded-t-lg bg-base">
						<span className="text-3xl font-semibold text-base-border">N</span>
					</header>
					<main className="h-25 w-full py-2">
						<div className="mb-1 block h-5 w-20 animate-pulse rounded-lg bg-base"></div>
						<div className="block h-5 w-40 animate-pulse rounded-lg bg-base"></div>
						<div className="mt-1 flex items-center justify-between">
							<div className="h-6 w-30 animate-pulse rounded-lg bg-base"></div>
							<Button className="animate-pulse cursor-pointer bg-base! px-7"></Button>
						</div>
					</main>
				</Card>
			))}
		</div>
	);
}
