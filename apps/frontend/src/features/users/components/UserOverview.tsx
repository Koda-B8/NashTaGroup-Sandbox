import Section from "../../../components/ui/section";
import StatCard, { StatGrid } from "../../../components/ui/stat-card";
import { getRoleName } from "../../../libs/format";
import type { ApiMeta } from "../../../types/pagination";
import type { User } from "../api";

export default function UserOverview({
	users,
	meta,
	loading,
}: {
	users: User[];
	meta: ApiMeta | null;
	loading: boolean;
}) {
	const totalUsers = meta?.pagination.total_items ?? users.length;
	const activeCount = users.filter((u) => u.isActive).length;
	const inactiveCount = meta
		? users.length - activeCount
		: totalUsers - activeCount;
	const adminCount = users.filter(
		(u) => getRoleName(u.role) === "admin",
	).length;

	return (
		<Section title="Overview">
			<StatGrid>
				<StatCard
					loading={loading}
					label="Total Users"
					value={totalUsers}
					note={`${activeCount} active`}
				/>
				<StatCard
					loading={loading}
					label="Active"
					value={activeCount}
					note={`${inactiveCount} inactive`}
				/>
				<StatCard
					loading={loading}
					label="Inactive"
					value={inactiveCount}
					note="Need attention"
				/>
				<StatCard
					loading={loading}
					label="Admins"
					value={adminCount}
					note={`${totalUsers - adminCount} cashiers`}
				/>
			</StatGrid>
		</Section>
	);
}
