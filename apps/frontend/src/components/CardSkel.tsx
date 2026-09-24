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
					<header className="w-full h-45 centerized rounded-t-xl animate-pulse bg-base">
						<h1 className="text-base-border!">N</h1>
					</header>
					<main className="w-full h-25 py-2">
						<div className="w-20 h-5 mb-1 block rounded-lg bg-base animate-pulse"></div>
						<div className="w-40 h-5 block rounded-lg bg-base animate-pulse"></div>
						<div className="flex items-center justify-between mt-1">
							<div className="w-30 rounded-lg h-6 bg-base animate-pulse"></div>
							<Button className="px-7 cursor-pointer bg-base! animate-pulse"></Button>
						</div>
					</main>
				</Card>
			))}
		</div>
	);
}
