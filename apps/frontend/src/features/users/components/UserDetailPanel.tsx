import Avatar from "../../../components/ui/avatar";
import Button from "../../../components/ui/button";
import Card from "../../../components/ui/card";
import StatTile from "../../../components/ui/stat-tile";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { formatDate, getRoleName } from "../../../libs/format";
import type { User } from "../api";

export default function UserDetailPanel({ user }: { user: User | undefined }) {
	if (!user)
		return (
			<Card
				padding="md"
				className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
			>
				<p className="py-10 text-center text-sm text-text">
					Pilih user untuk melihat detail.
				</p>
			</Card>
		);

	return (
		<Card
			padding="md"
			className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
		>
			<div className="flex flex-col items-center gap-2 text-center">
				<Avatar
					name={user.fullname}
					size="xl"
				/>
				<div>
					<p className="text-sm font-bold text-text-h">{user.fullname}</p>
					<p className="text-xs text-text">@{user.username}</p>
					<p
						className="truncate text-2xs text-text"
						title={user.id}
					>
						{user.id}
					</p>
				</div>
				<ActiveBadge isActive={user.isActive} />
			</div>
			<div className="border-t border-base-border" />
			<div className="grid grid-cols-2 gap-2">
				<StatTile
					label="Role"
					value={getRoleName(user.role)}
				/>
				<StatTile
					label="Status"
					value={user.isActive ? "Active" : "Inactive"}
				/>
				<StatTile
					label="Created"
					value={formatDate(user.createdAt)}
				/>
				<StatTile
					label="Updated"
					value={user.updatedAt ? formatDate(user.updatedAt) : "—"}
				/>
			</div>
			<div className="border-t border-base-border" />
			<div className="grid grid-cols-2 gap-2">
				<Button
					size="sm"
					onClick={() => {}}
				>
					Edit
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {}}
				>
					{user.isActive ? "Deactivate" : "Activate"}
				</Button>
			</div>
		</Card>
	);
}
