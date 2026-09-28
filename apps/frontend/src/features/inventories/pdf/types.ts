import type { MovementType } from "../api";

export type PdfMovementScope = "item" | "product";

export interface PdfMovementRow {
	date: string;
	type: MovementType;
	typeLabel: string;
	quantity: string;
	stockBefore: number;
	stockAfter: number;
	source: string;
	performedBy: string;
	reference: string;
	variant: string;
}

export interface InventoryMovementPdfSummary {
	total: number;
	additions: number;
	reductions: number;
	corrections: number;
	currentStock: number | null;
}

export interface InventoryMovementPdfData {
	fileName: string;
	scope: PdfMovementScope;
	productName: string;
	productCode: string;
	variantName: string;
	variantCount: number;
	periodLabel: string;
	filterLabel: string;
	generatedLabel: string;
	summary: InventoryMovementPdfSummary;
	rows: PdfMovementRow[];
}
