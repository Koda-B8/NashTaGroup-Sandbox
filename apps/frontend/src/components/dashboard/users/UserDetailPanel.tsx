import { formatDate, getRoleName } from "../../../libs/format";
import type { User } from "../../../services/users";
import Avatar from "../../ui/avatar";
import Badge from "../../ui/badge";
import Button from "../../ui/button";
import Card from "../../ui/card";

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
						className="truncate text-[10px] text-text"
						title={user.id}
					>
						{user.id}
					</p>
				</div>
				<Badge
					variant={user.isActive ? "primary" : "neutral"}
					size="sm"
				>
					{user.isActive ? "Active" : "Inactive"}
				</Badge>
			</div>
			<div className="border-t border-base-border" />
			<div className="grid grid-cols-2 gap-2">
				<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
					<p className="text-sm font-semibold text-text-h">
						{getRoleName(user.role)}
					</p>
					<p className="text-[11px] text-text">Role</p>
				</div>
				<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
					<p className="text-sm font-semibold text-text-h">
						{user.isActive ? "Active" : "Inactive"}
					</p>
					<p className="text-[11px] text-text">Status</p>
				</div>
				<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
					<p className="text-sm font-semibold text-text-h">
						{formatDate(user.createdAt)}
					</p>
					<p className="text-[11px] text-text">Created</p>
				</div>
				<div className="rounded-lg border border-base-border bg-base px-3 py-2.5">
					<p className="text-sm font-semibold text-text-h">
						{user.updatedAt ? formatDate(user.updatedAt) : "—"}
					</p>
					<p className="text-[11px] text-text">Updated</p>
				</div>
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
