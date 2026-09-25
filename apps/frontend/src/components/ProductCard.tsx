import type { ReactNode } from "react";

import Card from "./ui/card";

export function ProductGrid({ children }: Readonly<{ children: ReactNode }>) {
	return <div className="grid grid-cols-3 gap-3">{children}</div>;
}

interface ProductCardProps {
	media?: ReactNode;
	mediaClassName?: string;
	children: ReactNode;
}

export default function ProductCard({
	media,
	mediaClassName = "",
	children,
}: Readonly<ProductCardProps>) {
	return (
		<Card
			padding="none"
			className="p-1"
		>
			<header
				className={`centerized h-45 w-full rounded-t-lg bg-base ${mediaClassName}`}
			>
				{media ?? (
					<span className="text-3xl font-semibold text-base-border">N</span>
				)}
			</header>
			<main className="h-25 w-full p-2">{children}</main>
		</Card>
	);
}
