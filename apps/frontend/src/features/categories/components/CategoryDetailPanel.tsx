import Badge from "../../../components/ui/badge";
import Button from "../../../components/ui/button";
import Card from "../../../components/ui/card";
import { ActiveBadge } from "../../../components/ui/status-badge";
import { dotColor, formatDate } from "../../../libs/format";
import type { Category, CategoryAttribute } from "../api";

function AttributeRow({ attribute }: { attribute: CategoryAttribute }) {
	const options = attribute.options ?? [];

	return (
		<div className="flex flex-col gap-1.5 py-3">
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-sm font-medium text-text-h">
					{attribute.name || "—"}
				</span>
				<Badge
					variant="neutral"
					size="sm"
				>
					{attribute.isVariant ? "Variant" : "Spesifikasi"}
				</Badge>
				{attribute.isRequired && (
					<Badge
						variant="warn"
						size="sm"
					>
						Wajib
					</Badge>
				)}
			</div>

			{attribute.isVariant ? (
				options.length > 0 ? (
					<div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
						{options.map((option) => (
							<span
								key={option.id ?? option.name}
								className="inline-flex items-center gap-1.5 text-xs font-medium text-text-h"
							>
								{option.hex && (
									<span
										className="size-3 shrink-0 rounded-full border border-black/10"
										style={{ backgroundColor: option.hex }}
										aria-hidden
									/>
								)}
								{option.name}
							</span>
						))}
					</div>
				) : (
					<span className="text-xs text-text">Belum ada opsi.</span>
				)
			) : (
				<span className="text-xs text-text-h">{attribute.value || "—"}</span>
			)}
		</div>
	);
}

function DetailLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-2">
			<span className="text-xs text-text">{label}</span>
			<span className="text-xs font-medium text-text-h">{value}</span>
		</div>
	);
}

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
	const attributes = category.attributes ?? [];

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
					<p className="text-base font-bold text-text-h">{category.name}</p>
					<ActiveBadge isActive={category.isActive} />
				</div>
				<p
					className="truncate font-mono text-xs text-text"
					title={category.id}
				>
					{category.id}
				</p>
			</div>

			<div className="border-t border-base-border" />

			<div className="flex flex-col gap-1">
				<div className="flex items-baseline justify-between gap-2">
					<p className="text-3xs font-semibold tracking-wider text-text uppercase">
						Atribut
					</p>
					{attributes.length > 0 && (
						<span className="text-2xs text-text">
							{attributes.length} atribut
						</span>
					)}
				</div>
				{attributes.length === 0 ? (
					<p className="rounded-lg border border-dashed border-base-border px-3 py-4 text-center text-xs text-text">
						Belum ada atribut.
					</p>
				) : (
					<div className="flex flex-col divide-y divide-base-border">
						{attributes.map((attribute, index) => (
							<AttributeRow
								key={attribute.id ?? `${attribute.name}-${index}`}
								attribute={attribute}
							/>
						))}
					</div>
				)}
			</div>

			<div className="border-t border-base-border" />

			<div className="flex flex-col gap-1.5">
				<DetailLine
					label="Created"
					value={formatDate(category.createdAt)}
				/>
				<DetailLine
					label="Last Updated"
					value={formatDate(category.updatedAt)}
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
