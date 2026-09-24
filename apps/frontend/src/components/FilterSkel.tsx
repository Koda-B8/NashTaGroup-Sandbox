export default function FilterSkel({ count }: Readonly<{ count: number }>) {
	return (
		<section className="border-b border-base-border py-3">
			<div className="text-sm font-semibold h-5 w-20 bg-base rounded-lg"></div>
			<ul className="flex flex-col gap-1 text-sm mt-2 w-full ml-0"></ul>
			<ul className="flex flex-col gap-2 text-sm mt-2 w-full ml-0">
				{Array.from({ length: count }).map((_, index) => (
					<li
						key={index}
						className="flex gap-2 items-center justify-start list-outside"
					>
						<div className="peer-checked:text-text-h rounded-lg text-sm w-30 h-4 bg-base animate-pulse"></div>
					</li>
				))}
			</ul>
		</section>
	);
}
