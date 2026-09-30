import { Image as ImageIcon } from "lucide-react";
import type { ReactNode } from "react";

import Card from "./ui/card";

export function ProductGrid({ children }: Readonly<{ children: ReactNode }>) {
	return <div className="grid grid-cols-4 gap-3">{children}</div>;
}

interface ProductCardProps {
	media?: ReactNode | null;
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
			className="group flex flex-col overflow-hidden transition-colors hover:border-primary/40"
		>
			<header
				className={`centerized aspect-square w-full overflow-hidden bg-base text-base-border ${mediaClassName}`}
			>
				{media ?? (
					<ImageIcon
						size={28}
						strokeWidth={1.5}
					/>
				)}
			</header>
			<main className="flex flex-1 flex-col gap-1 p-3">{children}</main>
		</Card>
	);
}
