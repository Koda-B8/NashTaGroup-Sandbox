import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { formatRupiah } from "../../../libs/formatRupiah";
import type { ProductStats } from "../hooks/useProductsList";

export default function ProductOverview({
	stats,
	loading,
}: {
	stats: ProductStats;
	loading: boolean;
}) {
	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					accent
					loading={loading}
					label="Total Products"
					value={stats.total}
					note={`${stats.active} active · ${stats.inactive} inactive`}
					trend={{
						value: `${stats.activeRate}%`,
						good: stats.activeRate >= 50,
					}}
				/>
				<StatCard
					accent
					loading={loading}
					label="Active"
					value={stats.active}
					note={`${stats.activeRate}% of total`}
					trend={{
						value: `${stats.activeRate}%`,
						good: stats.activeRate >= 50,
					}}
				/>
				<StatCard
					accent
					loading={loading}
					label="Catalog"
					value={stats.categories}
					note={`${stats.brands} brands · ${stats.categories} categories`}
					trend={{ value: String(stats.brands), good: true }}
				/>
				<StatCard
					accent
					loading={loading}
					label="Inventory Value"
					value={formatRupiah(stats.inventoryValue)}
					note={`${stats.totalStock} units · ${stats.lowStock} low stock`}
					trend={{
						value: String(stats.totalStock),
						good: stats.lowStock === 0,
					}}
				/>
			</StatGrid>
		</Section>
	);
}
