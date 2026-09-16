import Card from "../../../components/ui/card";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { TransactionStats } from "../hooks/useTransactionsList";

function StatCard({
	label,
	value,
	note,
}: {
	label: string;
	value: string;
	note: string;
}) {
	return (
		<Card
			padding="md"
			className="flex flex-col gap-1"
		>
			<p
				className="truncate text-2xl font-bold tracking-tight text-text-h"
				title={value}
			>
				{value}
			</p>
			<p className="text-xs font-medium text-text-h">{label}</p>
			<p className="text-[11px] text-text">{note}</p>
		</Card>
	);
}

export default function TransactionOverview({
	stats,
	loading,
}: {
	stats: TransactionStats;
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
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label="Total Transactions"
					value={loading ? "—" : String(stats.total)}
					note={`${stats.memberCount} member on this page`}
				/>
				<StatCard
					label="Completed"
					value={loading ? "—" : String(stats.completed)}
					note={`${stats.completionRate}% of this page`}
				/>
				<StatCard
					label="Pending"
					value={loading ? "—" : String(stats.pending)}
					note={`${stats.cancelled} cancelled · ${stats.refunded} refunded`}
				/>
				<StatCard
					label="Revenue"
					value={loading ? "—" : formatRupiah(stats.revenue)}
					note="Completed on this page"
				/>
			</div>
		</section>
	);
}
