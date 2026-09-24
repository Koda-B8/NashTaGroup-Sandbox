import type { ReactNode } from "react";

import Card from "./ui/card";

interface AsideProps {
	headerName: string;
	Attribute?: ReactNode;
	Content?: ReactNode;
	Footer?: ReactNode;
}

export default function Aside({
	headerName,
	Attribute,
	Content,
	Footer,
}: Readonly<AsideProps>) {
	return (
		<Card
			padding="sm"
			className="relative flex h-full w-60 flex-1 flex-col"
		>
			<header className="flex items-center justify-between border-b border-b-base-border py-2">
				<h6>{headerName}</h6>
				{Attribute}
			</header>
			<main>{Content}</main>
			<footer className="mt-auto w-full">{Footer}</footer>
		</Card>
	);
}
