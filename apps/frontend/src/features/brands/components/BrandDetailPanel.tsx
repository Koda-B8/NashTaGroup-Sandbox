import Button from "../../../components/ui/button";
import Card from "../../../components/ui/card";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { dotColor, formatDate } from "../../../libs/format";
import type { Brand } from "../api";

function DetailLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-2">
			<span className="text-xs text-text">{label}</span>
			<span className="text-xs font-medium text-text-h">{value}</span>
		</div>
	);
}

export default function BrandDetailPanel({
	brand,
	onEdit,
	onDelete,
}: {
	brand: Brand | undefined;
	onEdit: () => void;
	onDelete: () => void;
}) {
	if (!brand)
		return (
			<Card
				padding="md"
				className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
			>
				<p className="py-10 text-center text-sm text-text">
					Pilih brand untuk melihat detail.
				</p>
			</Card>
		);

	const dot = dotColor(brand.name);

	return (
		<Card
			padding="md"
			className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
		>
			<div className="flex flex-col gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<span
						className="size-2.5 shrink-0 rounded-full"
						style={{ backgroundColor: dot }}
						aria-hidden
					/>
					<p className="font-bold text-base text-text-h">{brand.name}</p>
					<ActiveBadge isActive={brand.isActive} />
				</div>
				<p
					className="truncate font-mono text-xs text-text"
					title={brand.id}
				>
					{brand.id}
				</p>
			</div>

			<div className="border-t border-base-border" />

			<div className="flex flex-col gap-1.5">
				<DetailLine
					label="Created"
					value={formatDate(brand.createdAt)}
				/>
				<DetailLine
					label="Last Updated"
					value={formatDate(brand.updatedAt)}
				/>
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
