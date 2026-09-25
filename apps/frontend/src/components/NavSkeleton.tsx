import AppHeader from "./AppHeader";

export default function NavbarSkeleton() {
	return (
		<AppHeader
			leading={
				<div className="h-5 w-28 animate-pulse rounded-lg bg-base"></div>
			}
			actions={
				<>
					<div className="hidden h-8 w-52 animate-pulse rounded-lg bg-base lg:block"></div>
					<div className="size-9 animate-pulse rounded-full bg-base"></div>
				</>
			}
		/>
	);
}
