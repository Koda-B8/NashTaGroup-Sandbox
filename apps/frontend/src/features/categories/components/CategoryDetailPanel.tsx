import Button from "../../../components/ui/button";
import Card from "../../../components/ui/card";
import StatTile from "../../../components/ui/stat-tile";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { dotColor, formatDate, initials } from "../../../libs/format";
import type { Category } from "../api";

export default function CategoryDetailPanel({
	category,
	onEdit,
	onDelete,
}: {
	category: Category | undefined;
	onEdit: () => void;
	onDelete: () => void;
}) {
	if (!category)
		return (
			<Card
				padding="md"
				className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
			>
				<p className="py-10 text-center text-sm text-text">
					Pilih category untuk melihat detail.
				</p>
			</Card>
		);

	const dot = dotColor(category.name);

	return (
		<Card
			padding="md"
			className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<span
						className="size-2.5 rounded-full"
						style={{ backgroundColor: dot }}
						aria-hidden
					/>
					<p className="text-base font-bold text-text-h">{category.name}</p>
				</div>
				<p
					className="truncate text-xs text-text"
					title={category.id}
				>
					{category.id}
				</p>
				<ActiveBadge
					isActive={category.isActive}
					className="w-fit"
				/>
			</div>

			<div className="border-t border-base-border" />

			<div className="grid grid-cols-2 gap-2">
				<StatTile
					label="Created"
					value={formatDate(category.createdAt)}
				/>
				<StatTile
					label="Last Updated"
					value={formatDate(category.updatedAt)}
				/>
				<StatTile
					label="Status"
					value={category.isActive ? "Active" : "Inactive"}
				/>
				<StatTile
					label="Name length"
					value={`${category.name.length} chars`}
				/>
			</div>

			<div className="border-t border-base-border" />

			<div className="flex items-center gap-2 rounded-lg border border-base-border bg-base px-3 py-2.5">
				<span
					className="flex size-8 items-center justify-center rounded-lg text-sm font-bold"
					style={{ backgroundColor: `${dot}14`, color: dot }}
				>
					{initials(category.name)}
				</span>
				<div className="min-w-0">
					<p className="truncate text-xs font-medium text-text-h">
						{category.name}
					</p>
					<p className="text-[11px] text-text">
						{category.isActive ? "Active" : "Inactive"} •{" "}
						{formatDate(category.updatedAt)}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2">
				<Button
					size="sm"
					onClick={onEdit}
				>
					Edit
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onDelete}
				>
					Delete
				</Button>
			</div>
		</Card>
	);
}
