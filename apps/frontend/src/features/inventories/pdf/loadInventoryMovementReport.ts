import { safePdfText } from "../../../libs/pdf/primitives";
import {
	formatDay,
	formatGeneratedAt,
	formatStamp,
	sanitize,
	toDate,
} from "../../../libs/pdf/report";
import { type MovementSource, type MovementType } from "../api";
import { MOVEMENT_TYPE_LABEL } from "../format";
import { fetchAllInventoryMovements } from "../loadMovements";
import type {
	InventoryMovementPdfData,
	PdfMovementRow,
	PdfMovementScope,
} from "./types";

const SOURCE_SHORT: Record<MovementSource, string> = {
	checkout: "Checkout",
	manual_adjustment: "Manual",
};

function signedQuantity(type: MovementType, quantity: number): string {
	if (type === "addition") return `+${quantity}`;
	if (type === "reduction") return `-${quantity}`;
	return String(quantity);
}

export async function loadInventoryMovementReportPdfData(opts: {
	productItemIds: string[];
	scope?: PdfMovementScope;
	type?: MovementType;
	from?: string;
	to?: string;
	rangeLabel?: string;
	fallbackName?: string;
	fallbackCode?: string | null;
	generatedBy: string;
	now?: Date;
}): Promise<InventoryMovementPdfData> {
	const now = opts.now ?? new Date();
	const scope = opts.scope ?? "item";
	const movements = await fetchAllInventoryMovements({
		productItemIds: opts.productItemIds,
		type: opts.type,
		from: opts.from,
		to: opts.to,
	});

	const first = movements[0];
	const productName =
		first?.productItem.productName || opts.fallbackName || "Product item";
	const productCode = first?.productItem.productCode || opts.fallbackCode || "";
	const variantName = first?.productItem.variantName ?? "";

	const variantCount = new Set(
		movements
			.map(
				(movement) =>
					movement.productItem.variantName ||
					movement.productItem.productCode ||
					movement.productItem.id,
			)
			.filter(Boolean),
	).size;

	const rows: PdfMovementRow[] = movements.map((movement) => ({
		date: formatStamp(movement.createdAt),
		type: movement.type,
		typeLabel: MOVEMENT_TYPE_LABEL[movement.type],
		quantity: signedQuantity(movement.type, movement.quantity),
		stockBefore: movement.stockBefore,
		stockAfter: movement.stockAfter,
		source: SOURCE_SHORT[movement.source],
		performedBy: safePdfText(movement.performedBy?.fullname ?? "—"),
		reference: safePdfText(
			movement.transaction?.transactionNumber ?? movement.note ?? "—",
		),
		variant: safePdfText(
			movement.productItem.variantName ||
				movement.productItem.productCode ||
				"—",
		),
	}));

	const summary = {
		total: movements.length,
		additions: movements.filter((m) => m.type === "addition").length,
		reductions: movements.filter((m) => m.type === "reduction").length,
		corrections: movements.filter((m) => m.type === "correction").length,
		currentStock: scope === "item" ? (movements[0]?.stockAfter ?? null) : null,
	};

	const dates = movements
		.map((m) => toDate(m.createdAt))
		.filter((date): date is Date => date !== null);
	const movementPeriod =
		dates.length > 0
			? `${formatDay(new Date(Math.min(...dates.map((d) => d.getTime()))))} to ${formatDay(new Date(Math.max(...dates.map((d) => d.getTime()))))}`
			: undefined;
	const periodLabel = opts.rangeLabel ?? movementPeriod ?? "No movements";

	const filterLabel = opts.type
		? `${MOVEMENT_TYPE_LABEL[opts.type]} only`
		: "All movement types";

	const fileCode = sanitize(productCode || productName);
	const fileScope =
		scope === "product" ? "product-inventory-movement" : "inventory-movement";

	return {
		fileName: `${fileScope}-${fileCode}.pdf`,
		scope,
		productName: safePdfText(productName),
		productCode: safePdfText(productCode),
		variantName: safePdfText(variantName),
		variantCount,
		periodLabel: safePdfText(periodLabel),
		filterLabel: safePdfText(filterLabel),
		generatedLabel: safePdfText(formatGeneratedAt(now, opts.generatedBy)),
		summary,
		rows,
	};
}
