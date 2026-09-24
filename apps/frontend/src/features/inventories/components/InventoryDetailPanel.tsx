import Card from "../../../components/ui/card";
import StatTile from "../../../components/ui/stat-tile";
import { dotColor } from "../../../libs/format";
import type { InventoryItem } from "../api";
import { STOCK_STATUS_LABEL, STOCK_STATUS_TEXT } from "../format";
import StockStatusBadge from "./StockStatusBadge";

export default function InventoryDetailPanel({
	item,
}: {
	item: InventoryItem | undefined;
}) {
	if (!item)
		return (
			<Card
				padding="md"
				className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
			>
				<p className="py-10 text-center text-sm text-text">
					Pilih item inventory untuk melihat detail.
				</p>
			</Card>
		);

	return (
		<Card
			padding="md"
			className="flex h-fit flex-col gap-4 xl:sticky xl:top-4"
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<span
						className="size-2.5 rounded-full"
						style={{ backgroundColor: dotColor(item.category) }}
						aria-hidden
					/>
					<p className="text-base font-bold text-text-h">{item.productName}</p>
				</div>
				<p
					className="truncate text-xs text-text"
					title={item.id}
				>
					{item.id}
				</p>
				<StockStatusBadge status={item.stockStatus} />
			</div>

			<div className="border-t border-base-border" />

			<div className="grid grid-cols-2 gap-2">
				<StatTile
					label="Product Code"
					value={item.productCode || "—"}
				/>
				<StatTile
					label="Variant"
					value={item.variantName || "—"}
				/>
				<StatTile
					label="Brand"
					value={item.brand}
				/>
				<StatTile
					label="Category"
					value={item.category}
				/>
			</div>

			<div className="border-t border-base-border" />

			<div className="flex items-center justify-between rounded-lg border border-base-border bg-base px-3 py-2.5">
				<div className="flex flex-col">
					<span className="text-2xs text-text">Stock on hand</span>
					<span
						className={`text-lg font-bold ${STOCK_STATUS_TEXT[item.stockStatus]}`}
					>
						{item.stock}
					</span>
				</div>
				<span className="text-2xs font-medium text-text">
					{STOCK_STATUS_LABEL[item.stockStatus]}
				</span>
			</div>
		</Card>
	);
}
