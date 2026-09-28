import type { jsPDF } from "jspdf";

import {
	COLORS,
	fill,
	fitText,
	font,
	stroke,
} from "../../../libs/pdf/primitives";

export interface ProductReportPdfColumn {
	label: string;
	width: number;
	align: "left" | "right";
}

export interface ProductReportPdfData {
	fileName: string;
	title: string;
	productName: string;
	viewLabel: string;
	periodLabel: string;
	generatedLabel: string;
	summary: { label: string; value: string }[];
	columns: ProductReportPdfColumn[];
	rows: string[][];
}

const PAGE_W = 210;
const PAGE_H = 297;
const M = 11;
const RIGHT = PAGE_W - M;

const Y_HEADER_RULE = 26;
const Y_SUMMARY_LABEL = 39.5;
const Y_SUMMARY_VALUE = 46.2;
const Y_TABLE_TITLE = 60;
const Y_TABLE_HEADER = 67.5;
const Y_TABLE_ROW = 75;
const Y_ROW_LIMIT = 272;

const CONT_TITLE = 18;
const CONT_HEADER = 25.5;
const CONT_ROW = 33;

const Y_FOOTER_RULE = 281.2;
const Y_FOOTER = 288.4;
const ROW_H = 7.3;

function columnEdges(columns: ProductReportPdfColumn[]): number[] {
	const edges: number[] = [M];
	let x = M;
	for (const column of columns) {
		x += column.width;
		edges.push(x);
	}
	return edges;
}

function drawHeader(doc: jsPDF, data: ProductReportPdfData) {
	fill(doc, COLORS.primary);
	doc.roundedRect(M, 13, 9, 9, 2.2, 2.2, "F");
	font(doc, 12, "bold", COLORS.white);
	doc.text("N", M + 4.5, 19, { align: "center" });

	font(doc, 15, "bold", COLORS.textH);
	doc.text(data.title, M + 12, 17.4);
	font(doc, 8, "normal", COLORS.text);
	doc.text(fitText(doc, data.productName, 118), M + 12, 21.6);

	font(doc, 9.5, "bold", COLORS.textH);
	doc.text(fitText(doc, data.periodLabel, 62), RIGHT, 17.4, { align: "right" });
	font(doc, 7.5, "normal", COLORS.text);
	doc.text(fitText(doc, data.generatedLabel, 62), RIGHT, 21.6, {
		align: "right",
	});

	stroke(doc, COLORS.border, 0.3);
	doc.line(M, Y_HEADER_RULE, RIGHT, Y_HEADER_RULE);
}

function drawSummary(doc: jsPDF, data: ProductReportPdfData) {
	const cards = data.summary.slice(0, 4);
	if (cards.length === 0) return;
	const colW = (RIGHT - M) / cards.length;
	cards.forEach((card, index) => {
		const x = M + colW * index;
		if (index > 0) {
			stroke(doc, COLORS.border, 0.25);
			doc.line(x - 4, 33.5, x - 4, 52.5);
		}
		font(doc, 7.5, "normal", COLORS.text);
		doc.text(fitText(doc, card.label, colW - 5), x, Y_SUMMARY_LABEL);
		font(doc, 12, "bold", COLORS.textH);
		doc.text(fitText(doc, card.value, colW - 5), x, Y_SUMMARY_VALUE);
	});
}

function drawTableHeader(
	doc: jsPDF,
	columns: ProductReportPdfColumn[],
	edges: number[],
	y: number,
) {
	font(doc, 6.5, "bold", COLORS.text);
	columns.forEach((column, index) => {
		const x = column.align === "right" ? edges[index + 1]! : edges[index]!;
		doc.text(column.label.toUpperCase(), x, y, { align: column.align });
	});
	stroke(doc, COLORS.border, 0.25);
	doc.line(M, y + 1.6, RIGHT, y + 1.6);
}

function drawRow(
	doc: jsPDF,
	columns: ProductReportPdfColumn[],
	edges: number[],
	row: string[],
	y: number,
) {
	columns.forEach((column, index) => {
		const width = column.width - 2;
		const x = column.align === "right" ? edges[index + 1]! : edges[index]!;
		font(doc, 6.8, index === 0 ? "bold" : "normal", COLORS.textH);
		doc.text(fitText(doc, row[index] ?? "—", width), x, y, {
			align: column.align,
		});
	});
}

function drawTable(doc: jsPDF, data: ProductReportPdfData) {
	const edges = columnEdges(data.columns);
	font(doc, 10.5, "bold", COLORS.textH);
	doc.text(data.viewLabel, M, Y_TABLE_TITLE);
	drawTableHeader(doc, data.columns, edges, Y_TABLE_HEADER);

	if (data.rows.length === 0) {
		font(doc, 9, "normal", COLORS.text);
		doc.text("No data for this filter.", PAGE_W / 2, Y_TABLE_ROW + 8, {
			align: "center",
		});
		return;
	}

	let y = Y_TABLE_ROW;
	data.rows.forEach((row, index) => {
		if (y > Y_ROW_LIMIT) {
			doc.addPage();
			font(doc, 10.5, "bold", COLORS.textH);
			doc.text(`${data.viewLabel} (continued)`, M, CONT_TITLE);
			drawTableHeader(doc, data.columns, edges, CONT_HEADER);
			y = CONT_ROW;
		}
		drawRow(doc, data.columns, edges, row, y);
		if (index < data.rows.length - 1) {
			stroke(doc, COLORS.border, 0.2);
			doc.line(M, y + 1.7, RIGHT, y + 1.7);
		}
		y += ROW_H;
	});
}

function drawFooter(
	doc: jsPDF,
	data: ProductReportPdfData,
	page: number,
	totalPages: number,
) {
	stroke(doc, COLORS.border, 0.3);
	doc.line(M, Y_FOOTER_RULE, RIGHT, Y_FOOTER_RULE);
	font(doc, 7, "normal", COLORS.text);
	doc.text(
		fitText(
			doc,
			"Nashta Group · Product Transaction Report · Confidential",
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

export function drawProductReport(doc: jsPDF, data: ProductReportPdfData) {
	fill(doc, COLORS.white);
	doc.rect(0, 0, PAGE_W, PAGE_H, "F");
	drawHeader(doc, data);
	drawSummary(doc, data);
	drawTable(doc, data);

	const totalPages = doc.getNumberOfPages();
	for (let page = 1; page <= totalPages; page++) {
		doc.setPage(page);
		drawFooter(doc, data, page, totalPages);
	}
}

export async function downloadProductReportPdf(
	data: ProductReportPdfData,
	filename: string,
): Promise<void> {
	const { jsPDF: JsPdf } = await import("jspdf");
	const doc = new JsPdf({ unit: "mm", format: "a4", orientation: "portrait" });
	drawProductReport(doc, data);
	doc.save(filename);
}
