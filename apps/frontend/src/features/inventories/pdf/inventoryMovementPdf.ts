import type { jsPDF } from "jspdf";

import {
	COLORS,
	fill,
	fitText,
	font,
	stroke,
	type Rgb,
} from "../../../libs/pdf/primitives";
import type {
	InventoryMovementPdfData,
	PdfMovementRow,
	PdfMovementScope,
} from "./types";

const TYPE_COLOR: Record<PdfMovementRow["type"], { text: Rgb; bg: Rgb }> = {
	addition: { text: COLORS.validText, bg: COLORS.validBg },
	reduction: { text: COLORS.dangerText, bg: COLORS.dangerBg },
	correction: { text: COLORS.infoText, bg: COLORS.infoBg },
};

/* layout (mm) */
const PAGE_W = 210;
const PAGE_H = 297;
const M = 11;
const RIGHT = PAGE_W - M;

const Y_HEADER_RULE = 26;
const Y_SUMMARY_LABEL = 39.5;
const Y_SUMMARY_VALUE = 46.2;
const Y_SUMMARY_NOTE = 50.6;
const Y_TABLE_TITLE = 63.8;
const Y_TABLE_HEADER = 71.5;
const Y_TABLE_ROW = 79;
const Y_ROW_LIMIT = 272;

const CONT_TITLE = 18;
const CONT_HEADER = 25.5;
const CONT_ROW = 33;

const Y_FOOTER_RULE = 281.2;
const Y_FOOTER = 288.4;

const ROW_H = 7.3;

/* table columns (mm) */
const COL_ITEM = {
	date: M,
	type: 35,
	qty: 64,
	stock: 71,
	source: 98,
	by: 121,
	ref: 151,
} as const;

const COL_PRODUCT = {
	date: M,
	variant: 32,
	type: 66,
	qty: 92,
	stock: 98,
	by: 124,
	ref: 154,
} as const;

function reportTitle(scope: PdfMovementScope): string {
	return scope === "product"
		? "Product Inventory Movement Report"
		: "Inventory Movement Report";
}

function drawHeader(doc: jsPDF, data: InventoryMovementPdfData) {
	fill(doc, COLORS.primary);
	doc.roundedRect(M, 13, 9, 9, 2.2, 2.2, "F");
	font(doc, 12, "bold", COLORS.white);
	doc.text("N", M + 4.5, 19, { align: "center" });

	font(doc, 15, "bold", COLORS.textH);
	doc.text(reportTitle(data.scope), M + 12, 17.4);
	font(doc, 8, "normal", COLORS.text);
	doc.text(
		fitText(
			doc,
			[data.productName, data.productCode].filter(Boolean).join(" · "),
			118,
		),
		M + 12,
		21.6,
	);

	font(doc, 9.5, "bold", COLORS.textH);
	doc.text(fitText(doc, data.periodLabel, 62), RIGHT, 17.4, { align: "right" });
	font(doc, 7.5, "normal", COLORS.text);
	doc.text(fitText(doc, data.generatedLabel, 62), RIGHT, 21.6, {
		align: "right",
	});

	stroke(doc, COLORS.border, 0.3);
	doc.line(M, Y_HEADER_RULE, RIGHT, Y_HEADER_RULE);
}

function drawSummary(doc: jsPDF, data: InventoryMovementPdfData) {
	const s = data.summary;
	const colW = (RIGHT - M) / 4;
	const cards: { label: string; value: string }[] = [
		{ label: "Total Movements", value: s.total.toLocaleString("en-US") },
		{ label: "Additions", value: s.additions.toLocaleString("en-US") },
		{ label: "Reductions", value: s.reductions.toLocaleString("en-US") },
		{ label: "Corrections", value: s.corrections.toLocaleString("en-US") },
	];

	cards.forEach((card, index) => {
		const x = M + colW * index;
		if (index > 0) {
			stroke(doc, COLORS.border, 0.25);
			doc.line(x - 4, 33.5, x - 4, 52.5);
		}
		font(doc, 7.5, "normal", COLORS.text);
		doc.text(card.label, x, Y_SUMMARY_LABEL);
		font(doc, 13, "bold", COLORS.textH);
		doc.text(fitText(doc, card.value, colW - 5), x, Y_SUMMARY_VALUE);
	});

	const scopeNote =
		data.scope === "product"
			? `${data.variantCount} varian`
			: data.variantName || null;
	const noteParts = [
		s.currentStock === null ? null : `Current stock: ${s.currentStock}`,
		data.filterLabel,
		scopeNote,
	].filter(Boolean);
	font(doc, 7, "normal", COLORS.text);
	doc.text(fitText(doc, noteParts.join("  ·  "), RIGHT - M), M, Y_SUMMARY_NOTE);
}

function drawTableHeader(doc: jsPDF, scope: PdfMovementScope, y: number) {
	font(doc, 6.5, "bold", COLORS.text);
	if (scope === "product") {
		doc.text("DATE", COL_PRODUCT.date, y);
		doc.text("VARIANT", COL_PRODUCT.variant, y);
		doc.text("TYPE", COL_PRODUCT.type, y);
		doc.text("QTY", COL_PRODUCT.qty, y, { align: "right" });
		doc.text("STOCK", COL_PRODUCT.stock, y);
		doc.text("BY", COL_PRODUCT.by, y);
		doc.text("REFERENCE", COL_PRODUCT.ref, y);
	} else {
		doc.text("DATE", COL_ITEM.date, y);
		doc.text("TYPE", COL_ITEM.type, y);
		doc.text("QTY", COL_ITEM.qty, y, { align: "right" });
		doc.text("STOCK", COL_ITEM.stock, y);
		doc.text("SOURCE", COL_ITEM.source, y);
		doc.text("BY", COL_ITEM.by, y);
		doc.text("REFERENCE", COL_ITEM.ref, y);
	}
	stroke(doc, COLORS.border, 0.25);
	doc.line(M, y + 1.6, RIGHT, y + 1.6);
}

function drawTableTitle(doc: jsPDF, title: string, y: number) {
	font(doc, 10.5, "bold", COLORS.textH);
	doc.text(title, M, y);
}

function drawTypeBadge(doc: jsPDF, row: PdfMovementRow, x: number, y: number) {
	const tone = TYPE_COLOR[row.type];
	font(doc, 6.5, "bold", tone.text);
	const labelW = doc.getTextWidth(row.typeLabel) + 3.2;
	fill(doc, tone.bg);
	doc.roundedRect(x, y - 3.1, labelW, 4.4, 2.2, 2.2, "F");
	font(doc, 6.5, "bold", tone.text);
	doc.text(row.typeLabel, x + 1.6, y);
}

function drawStockCell(
	doc: jsPDF,
	before: number,
	after: number,
	x: number,
	y: number,
) {
	const beforeText = String(before);
	const afterText = String(after);

	font(doc, 7, "normal", COLORS.textH);
	doc.text(beforeText, x, y);
	const beforeWidth = doc.getTextWidth(beforeText);

	const gap = 1.6;
	const arrowLength = 4.4;
	const headLength = 1.5;
	const arrowY = y - 1.05;
	const startX = x + beforeWidth + gap;
	const endX = startX + arrowLength;

	stroke(doc, COLORS.text, 0.2);
	doc.line(startX, arrowY, endX - headLength, arrowY);
	fill(doc, COLORS.text);
	doc.triangle(
		endX,
		arrowY,
		endX - headLength,
		arrowY - 0.75,
		endX - headLength,
		arrowY + 0.75,
		"F",
	);

	doc.text(afterText, endX + gap, y);
}

function drawRow(
	doc: jsPDF,
	row: PdfMovementRow,
	scope: PdfMovementScope,
	y: number,
) {
	const tone = TYPE_COLOR[row.type];

	if (scope === "product") {
		font(doc, 7, "normal", COLORS.text);
		doc.text(fitText(doc, row.date, 20), COL_PRODUCT.date, y);
		font(doc, 6.5, "normal", COLORS.textH);
		doc.text(fitText(doc, row.variant, 31), COL_PRODUCT.variant, y);
		drawTypeBadge(doc, row, COL_PRODUCT.type, y);
		font(doc, 7.5, "bold", tone.text);
		doc.text(row.quantity, COL_PRODUCT.qty, y, { align: "right" });
		drawStockCell(doc, row.stockBefore, row.stockAfter, COL_PRODUCT.stock, y);
		font(doc, 6.5, "normal", COLORS.text);
		doc.text(fitText(doc, row.performedBy, 28), COL_PRODUCT.by, y);
		doc.text(
			fitText(doc, row.reference, RIGHT - COL_PRODUCT.ref),
			COL_PRODUCT.ref,
			y,
		);
		return;
	}

	font(doc, 7, "normal", COLORS.text);
	doc.text(fitText(doc, row.date, 23), COL_ITEM.date, y);
	drawTypeBadge(doc, row, COL_ITEM.type, y);
	font(doc, 7.5, "bold", tone.text);
	doc.text(row.quantity, COL_ITEM.qty, y, { align: "right" });
	drawStockCell(doc, row.stockBefore, row.stockAfter, COL_ITEM.stock, y);
	font(doc, 6.5, "normal", COLORS.text);
	doc.text(fitText(doc, row.source, 21), COL_ITEM.source, y);
	doc.text(fitText(doc, row.performedBy, 28), COL_ITEM.by, y);
	doc.text(fitText(doc, row.reference, RIGHT - COL_ITEM.ref), COL_ITEM.ref, y);
}

function drawEmpty(doc: jsPDF) {
	font(doc, 9, "normal", COLORS.text);
	doc.text(
		"No movements recorded for this item.",
		PAGE_W / 2,
		Y_TABLE_ROW + 8,
		{ align: "center" },
	);
}

function drawMovements(doc: jsPDF, data: InventoryMovementPdfData) {
	drawTableTitle(doc, "Movement History", Y_TABLE_TITLE);
	drawTableHeader(doc, data.scope, Y_TABLE_HEADER);

	if (data.rows.length === 0) {
		drawEmpty(doc);
		return;
	}

	let y = Y_TABLE_ROW;
	data.rows.forEach((row, index) => {
		if (y > Y_ROW_LIMIT) {
			doc.addPage();
			drawTableTitle(doc, "Movement History (continued)", CONT_TITLE);
			drawTableHeader(doc, data.scope, CONT_HEADER);
			y = CONT_ROW;
		}
		drawRow(doc, row, data.scope, y);
		if (index < data.rows.length - 1) {
			stroke(doc, COLORS.border, 0.2);
			doc.line(M, y + 1.7, RIGHT, y + 1.7);
		}
		y += ROW_H;
	});
}

function drawFooter(
	doc: jsPDF,
	data: InventoryMovementPdfData,
	page: number,
	totalPages: number,
) {
	stroke(doc, COLORS.border, 0.3);
	doc.line(M, Y_FOOTER_RULE, RIGHT, Y_FOOTER_RULE);
	font(doc, 7, "normal", COLORS.text);
	doc.text(
		fitText(
			doc,
			"Nashta Group · Inventory Movement Report · Confidential",
			100,
		),
		M,
		Y_FOOTER,
	);
	const right =
		totalPages > 1
			? `${data.generatedLabel}  ·  Page ${page} of ${totalPages}`
			: data.generatedLabel;
	doc.text(fitText(doc, right, 100), RIGHT, Y_FOOTER, { align: "right" });
}

export function drawInventoryMovementReport(
	doc: jsPDF,
	data: InventoryMovementPdfData,
) {
	fill(doc, COLORS.white);
	doc.rect(0, 0, PAGE_W, PAGE_H, "F");
	drawHeader(doc, data);
	drawSummary(doc, data);
	drawMovements(doc, data);

	const totalPages = doc.getNumberOfPages();
	for (let page = 1; page <= totalPages; page++) {
		doc.setPage(page);
		drawFooter(doc, data, page, totalPages);
	}
}

export async function downloadInventoryMovementReportPdf(
	data: InventoryMovementPdfData,
	filename: string,
): Promise<void> {
	const { jsPDF: JsPdf } = await import("jspdf");
	const doc = new JsPdf({ unit: "mm", format: "a4", orientation: "portrait" });
	drawInventoryMovementReport(doc, data);
	doc.save(filename);
}
