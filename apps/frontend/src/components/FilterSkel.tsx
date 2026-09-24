export default function FilterSkel({ count }: Readonly<{ count: number }>) {
	return (
		<section className="border-b border-base-border py-3">
			<div className="h-5 w-20 rounded-lg bg-base text-sm font-semibold"></div>
			<ul className="mt-2 ml-0 flex w-full flex-col gap-1 text-sm"></ul>
			<ul className="mt-2 ml-0 flex w-full flex-col gap-2 text-sm">
				{Array.from({ length: count }).map((_, index) => (
					<li
						key={index}
						className="flex list-outside items-center justify-start gap-2"
					>
						<div className="h-4 w-30 animate-pulse rounded-lg bg-base text-sm peer-checked:text-text-h"></div>
					</li>
				))}
			</ul>
		</section>
	);
}
