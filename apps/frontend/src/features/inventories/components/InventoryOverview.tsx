import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import type { InventoryStats } from "../hooks/useInventoryStats";

export default function InventoryOverview({
	stats,
	loading,
}: {
	stats: InventoryStats;
	loading: boolean;
}) {
	const healthyRate = stats.total
		? Math.round((stats.available / stats.total) * 100)
		: 0;

	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					accent
					loading={loading}
					label="Total SKUs"
					value={stats.total}
					note="Seluruh varian aktif"
				/>
				<StatCard
					accent
					loading={loading}
					label="Available"
					value={stats.available}
					note={`${healthyRate}% dari total`}
					trend={{ value: `${healthyRate}%`, good: healthyRate >= 50 }}
				/>
				<StatCard
					accent
					loading={loading}
					label="Low Stock"
					value={stats.low}
					note="1–9 unit"
					trend={{ value: String(stats.low), good: stats.low === 0 }}
				/>
				<StatCard
					accent
					loading={loading}
					label="Out of Stock"
					value={stats.outOfStock}
					note="Perlu restock"
					trend={{
						value: String(stats.outOfStock),
						good: stats.outOfStock === 0,
					}}
				/>
			</StatGrid>
		</Section>
	);
}
