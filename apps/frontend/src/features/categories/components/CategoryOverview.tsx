import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { formatDate } from "../../../libs/format";
import type { CategoryStats } from "../hooks/useCategoriesList";

export default function CategoryOverview({
	stats,
	loading,
}: {
	stats: CategoryStats;
	loading: boolean;
}) {
	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					loading={loading}
					label="Total Categories"
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
					label="Best Category"
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
