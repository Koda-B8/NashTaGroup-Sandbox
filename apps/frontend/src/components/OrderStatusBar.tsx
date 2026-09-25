import Button from "./ui/button";

export default function OrderStatusBar() {
	return (
		<header className="flex items-center gap-2">
			<div className="flex h-10 flex-1 items-center rounded-lg border border-base-border bg-surface pl-4 text-sm">
				<p>Siap dibayar • Estimasi 30–45 menit</p>
			</div>
			<Button
				variant="outline"
				className="shrink-0"
			>
				Bantuan ?
			</Button>
		</header>
	);
}
