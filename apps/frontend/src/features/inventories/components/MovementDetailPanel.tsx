import type { ReactNode } from "react";

import DetailPanel from "../../../components/ui/detail-panel";
import Eyebrow from "../../../components/ui/eyebrow";
import { StatStrip, StatStripItem } from "../../../components/ui/stat-tile";
import type { InventoryMovement } from "../api";
import {
	formatDateTime,
	formatMovementQuantity,
	MOVEMENT_TYPE_TEXT,
} from "../format";
import MovementSourceBadge from "./MovementSourceBadge";
import MovementTypeBadge from "./MovementTypeBadge";

function DetailRow({
	label,
	value,
	title,
}: {
	label: string;
	value: ReactNode;
	title?: string;
}) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="shrink-0 text-xs text-text">{label}</span>
			<span
				className="truncate text-sm font-medium text-text-h"
				title={title}
			>
				{value}
			</span>
		</div>
	);
}

export default function MovementDetailPanel({
	movement,
}: {
	movement: InventoryMovement | undefined;
}) {
	if (!movement)
		return <DetailPanel empty={"Pilih pergerakan untuk melihat detail."} />;

	return (
		<DetailPanel>
			<div className="flex flex-col gap-2">
				<p className="font-bold text-base text-text-h">
					{movement.productItem.productName}
				</p>
				<p
					className="truncate text-xs text-text"
					title={movement.productItem.id}
				>
					{movement.productItem.productCode || movement.productItem.id}
				</p>
				<div className="flex flex-wrap items-center gap-1.5">
					<MovementTypeBadge type={movement.type} />
					<MovementSourceBadge source={movement.source} />
				</div>
			</div>

			<div className="border-t border-base-border" />

			<StatStrip>
				<StatStripItem label="Quantity">
					<span
						className={`text-lg font-bold ${MOVEMENT_TYPE_TEXT[movement.type]}`}
					>
						{formatMovementQuantity(movement.type, movement.quantity)}
					</span>
				</StatStripItem>
				<StatStripItem
					label="Stock"
					end
				>
					<span className="text-sm font-semibold text-text-h">
						{movement.stockBefore}
						<span
							className="mx-1 text-text"
							aria-hidden
						>
							→
						</span>
						{movement.stockAfter}
					</span>
				</StatStripItem>
			</StatStrip>

			<div className="flex flex-col gap-2.5">
				<DetailRow
					label="Variant"
					value={movement.productItem.variantName || "—"}
				/>
				<DetailRow
					label="Performed by"
					value={movement.performedBy?.fullname ?? "—"}
				/>
				<DetailRow
					label="Transaction"
					value={movement.transaction?.transactionNumber ?? "—"}
					title={movement.transaction?.transactionNumber}
				/>
				<DetailRow
					label="Date"
					value={formatDateTime(movement.createdAt)}
				/>
			</div>

			{movement.note && (
				<>
					<div className="border-t border-base-border" />
					<div className="flex flex-col gap-1">
						<Eyebrow>Note</Eyebrow>
						<p className="text-xs text-text-h">{movement.note}</p>
					</div>
				</>
			)}
		</DetailPanel>
	);
}
