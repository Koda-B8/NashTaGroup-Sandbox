export default function NavbarSkeleton() {
	return (
		<nav className="w-full h-17 shadow-sm flex items-center px-7 justify-between">
			<section
				className="flex text-xs gap-xp lg:text-lg lg:items-center 
			lg:gap-10 flex-col-reverse lg:flex-row"
			>
				<div className="w-20 h-9 bg-base animate-pulse"></div>
			</section>
			<section className="flex items-center gap-3">
				<div className="w-60 h-9 bg-base animate-pulse"></div>
				<div className="h-9 w-9 bg-base rounded-full animate-pulse"></div>
			</section>
		</nav>
	);
}
