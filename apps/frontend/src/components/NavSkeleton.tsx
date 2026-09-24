export default function NavbarSkeleton() {
	return (
		<div className="flex h-14 w-full shrink-0 items-center gap-4 border-b border-base-border bg-surface px-4">
			<div className="h-5 w-28 animate-pulse rounded bg-base"></div>
			<div className="ml-auto flex items-center gap-3">
				<div className="hidden h-8 w-52 animate-pulse rounded-lg bg-base lg:block"></div>
				<div className="h-9 w-9 animate-pulse rounded-full bg-base"></div>
			</div>
		</div>
	);
}
