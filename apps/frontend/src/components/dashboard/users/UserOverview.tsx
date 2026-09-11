import { getRoleName } from "../../../libs/format";
import type { User } from "../../../services/users";
import type { ApiMeta } from "../../../types/pagination";
import Card from "../../ui/card";

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
		<section aria-labelledby="overview-heading">
			<h2
				id="overview-heading"
				className="mb-3 text-[11px] font-semibold tracking-wider text-text uppercase"
			>
				Overview
			</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Card
					padding="md"
					className="flex flex-col gap-1"
				>
					<p className="text-2xl font-bold tracking-tight text-text-h">
						{loading ? "—" : totalUsers}
					</p>
					<p className="text-xs font-medium text-text-h">Total Users</p>
					<p className="text-[11px] text-text">{activeCount} active</p>
				</Card>
				<Card
					padding="md"
					className="flex flex-col gap-1"
				>
					<p className="text-2xl font-bold tracking-tight text-text-h">
						{loading ? "—" : activeCount}
					</p>
					<p className="text-xs font-medium text-text-h">Active</p>
					<p className="text-[11px] text-text">{inactiveCount} inactive</p>
				</Card>
				<Card
					padding="md"
					className="flex flex-col gap-1"
				>
					<p className="text-2xl font-bold tracking-tight text-text-h">
						{loading ? "—" : inactiveCount}
					</p>
					<p className="text-xs font-medium text-text-h">Inactive</p>
					<p className="text-[11px] text-text">Need attention</p>
				</Card>
				<Card
					padding="md"
					className="flex flex-col gap-1"
				>
					<p className="text-2xl font-bold tracking-tight text-text-h">
						{loading ? "—" : adminCount}
					</p>
					<p className="text-xs font-medium text-text-h">Admins</p>
					<p className="text-[11px] text-text">
						{totalUsers - adminCount} cashiers
					</p>
				</Card>
			</div>
		</section>
	);
}
