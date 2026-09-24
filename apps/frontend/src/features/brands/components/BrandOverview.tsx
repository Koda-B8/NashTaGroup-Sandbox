import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { formatDate } from "../../../libs/format";
import type { BrandStats } from "../hooks/useBrandsList";

export default function BrandOverview({
	stats,
	loading,
}: {
	stats: BrandStats;
	loading: boolean;
}) {
	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					loading={loading}
					label="Total Brands"
					value={stats.total}
					note={`${stats.active} active`}
				/>
				<StatCard
					loading={loading}
					label="Active"
					value={stats.active}
					note={`${stats.inactive} inactive`}
				/>
				<StatCard
					loading={loading}
					label="Best Brand"
					value={stats.best?.name ?? "—"}
					note={stats.best ? formatDate(stats.best.updatedAt) : "—"}
				/>
				<StatCard
					loading={loading}
					label="Active Rate"
					value={`${stats.activeRate}%`}
					note="This month"
				/>
			</StatGrid>
		</Section>
	);
}
