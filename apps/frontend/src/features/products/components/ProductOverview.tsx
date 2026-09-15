import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import Badge from "../../../components/ui/badge";
import Card from "../../../components/ui/card";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { ProductStats } from "../hooks/useProductsList";

function TrendChip({ value, good }: { value: string; good: boolean }) {
	return (
		<Badge
			variant={good ? "valid" : "danger"}
			size="sm"
			className="shrink-0"
		>
			{good ? <ArrowUpRightIcon size={12} /> : <ArrowDownRightIcon size={12} />}
			{value}
		</Badge>
	);
}

interface StatCardProps {
	label: string;
	value: string;
	note: string;
	trend: string;
	good: boolean;
}

function StatCard({ label, value, note, trend, good }: StatCardProps) {
	return (
		<Card
			padding="sm"
			className="flex flex-col justify-between gap-3 border-l-4 border-l-primary transition-shadow hover:shadow-sm"
		>
			<div className="flex flex-wrap items-start justify-between gap-1">
				<p
					className="min-w-0 truncate text-xl font-bold tracking-tight text-text-h"
					title={value}
				>
					{value}
				</p>
				<TrendChip
					value={trend}
					good={good}
				/>
			</div>
			<div className="flex flex-col gap-0.5">
				<p className="text-xs font-medium text-text-h">{label}</p>
				<p className="text-[11px] text-text">{note}</p>
			</div>
		</Card>
	);
}

export default function ProductOverview({
	stats,
	loading,
}: {
	stats: ProductStats;
	loading: boolean;
}) {
	return (
		<section aria-labelledby="overview-heading">
			<h2
				id="overview-heading"
				className="mb-3 text-[11px] font-semibold tracking-wider text-text uppercase"
			>
				Overview
			</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Total Products"
					value={loading ? "—" : String(stats.total)}
					note={`${stats.active} active · ${stats.inactive} inactive`}
					trend={`${stats.activeRate}%`}
					good={stats.activeRate >= 50}
				/>
				<StatCard
					label="Active"
					value={loading ? "—" : String(stats.active)}
					note={`${stats.activeRate}% of total`}
					trend={`${stats.activeRate}%`}
					good={stats.activeRate >= 50}
				/>
				<StatCard
					label="Catalog"
					value={loading ? "—" : String(stats.categories)}
					note={`${stats.brands} brands · ${stats.categories} categories`}
					trend={`${stats.brands}`}
					good
				/>
				<StatCard
					label="Inventory Value"
					value={loading ? "—" : formatRupiah(stats.inventoryValue)}
					note={`${stats.totalStock} units · ${stats.lowStock} low stock`}
					trend={`${stats.totalStock}`}
					good={stats.lowStock === 0}
				/>
			</div>
		</section>
	);
}
