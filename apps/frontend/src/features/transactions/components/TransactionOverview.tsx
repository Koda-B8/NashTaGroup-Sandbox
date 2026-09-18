import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { TransactionStats } from "../hooks/useTransactionsList";

export default function TransactionOverview({
	stats,
	loading,
}: {
	stats: TransactionStats;
	loading: boolean;
}) {
	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					loading={loading}
					label="Total Transactions"
					value={stats.total}
					note={`${stats.memberCount} member on this page`}
				/>
				<StatCard
					loading={loading}
					label="Completed"
					value={stats.completed}
					note={`${stats.completionRate}% of this page`}
				/>
				<StatCard
					loading={loading}
					label="Pending"
					value={stats.pending}
					note={`${stats.cancelled} cancelled · ${stats.refunded} refunded`}
				/>
				<StatCard
					loading={loading}
					label="Revenue"
					value={formatRupiah(stats.revenue)}
					note="Completed on this page"
				/>
			</StatGrid>
		</Section>
	);
}
