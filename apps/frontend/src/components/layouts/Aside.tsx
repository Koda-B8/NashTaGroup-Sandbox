import type { ReactNode } from "react";

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
		<div className=" w-60 bg-white border border-base-border p-4 h-full flex-1 rounded-md flex flex-col relative ">
			<header className=" border-b py-2 border-b-base-border flex items-center justify-between ">
				<h6>{headerName}</h6>
				{Attribute}
			</header>
			<main>{Content}</main>
			<footer className="w-full mt-auto">{Footer}</footer>
		</div>
	);
}
