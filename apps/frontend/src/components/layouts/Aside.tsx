import type { ReactNode } from "react";

interface AsideProps {
	headerName: string;
	Attribute?: ReactNode;
}

export default function Aside({ headerName, Attribute }: Readonly<AsideProps>) {
	return (
		<div className=" w-60 bg-white border border-base-border p-4 h-full flex-1 rounded-md flex flex-col relative ">
			<header className=" border-b py-2 border-b-base-border flex items-center justify-between ">
				<p>{headerName}</p>
				{Attribute}
			</header>
			<main>
				<section className="border-b border-b-base-border min-h-10" />
				<section className="border-b border-b-base-border min-h-10" />
				<section className="min-h-10" />
			</main>
			<footer className="w-full h-10 bg-amber-200 mt-auto" />
		</div>
	);
}
