import type { jsPDF } from "jspdf";

import type {
	PdfCashierRow,
	PdfCategoryRow,
	PdfMethodRow,
	PdfProductRow,
	PdfStockRow,
	SalesReportPdfData,
} from "./types";

export type Rgb = readonly [number, number, number];

export const COLORS = {
	primary: [59, 130, 246],
	primarySoft: [147, 184, 251],
	track: [238, 240, 243],
	border: [236, 236, 238],
	text: [148, 149, 159],
	textH: [18, 18, 21],
	validText: [20, 133, 82],
	validBg: [229, 245, 235],
	dangerText: [185, 28, 28],
	dangerBg: [254, 226, 226],
	warnText: [180, 83, 9],
	warnBg: [254, 243, 199],
	white: [255, 255, 255],
} as const;

/* layout (mm) */
const PAGE_W = 210;
const PAGE_H = 297;
const M = 11;
const RIGHT = PAGE_W - M;
const LEFT_W = 90.8;
const RIGHT_X = 107.7;
const RIGHT_W = RIGHT - RIGHT_X;

/* section anchors, mirrored from the reference design */
const Y_HEADER_RULE = 26;
const Y_SUMMARY_LABEL = 39.5;
const Y_SUMMARY_VALUE = 46.2;
const Y_SUMMARY_DELTA = 50.4;
const Y_TREND_TITLE = 63.8;
const Y_CHART_TOP = 68;
const Y_CHART_BASE = 91.5;
const Y_CHART_LABELS = 96;
const Y_TABLE_A_TITLE = 117.6;
const Y_TABLE_A_HEADER = 124.9;
const Y_TABLE_A_ROW = 132.6;
const Y_TABLE_B_TITLE = 174.3;
const Y_TABLE_B_HEADER = 181.9;
const Y_TABLE_B_ROW = 189;
const Y_STOCK_TITLE = 223.8;
const Y_STOCK_HEADER = 231;
const Y_STOCK_ROW = 238.8;
const ROW_H = 7.3;

function font(
	doc: jsPDF,
	size: number,
	style: "normal" | "bold" = "normal",
	color: Rgb = COLORS.text,
) {
	doc.setFont("helvetica", style);
	doc.setFontSize(size);
	doc.setTextColor(color[0], color[1], color[2]);
}

function fill(doc: jsPDF, color: Rgb) {
	doc.setFillColor(color[0], color[1], color[2]);
}

function stroke(doc: jsPDF, color: Rgb, width = 0.25) {
	doc.setDrawColor(color[0], color[1], color[2]);
	doc.setLineWidth(width);
}

function fitText(doc: jsPDF, text: string, maxWidth: number): string {
	if (doc.getTextWidth(text) <= maxWidth) return text;
	let cut = text;
	while (cut.length > 0 && doc.getTextWidth(`${cut}...`) > maxWidth) {
		cut = cut.slice(0, -1);
	}
	return cut.length > 0 ? `${cut}...` : text.slice(0, 1);
}

export function formatIdr(value: number): string {
	return `Rp ${Math.round(value).toLocaleString("en-US")}`;
}

export function formatCompactIdr(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}B`;
	if (abs >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}M`;
	if (abs >= 1e3) return `Rp ${(value / 1e3).toFixed(0)}K`;
	return `Rp ${Math.round(value)}`;
}

function drawDelta(
	doc: jsPDF,
	x: number,
	y: number,
	delta: number | null,
	suffix = "vs prev. period",
) {
	if (delta === null || !Number.isFinite(delta)) {
		font(doc, 7, "normal", COLORS.text);
		doc.text("No prior data", x, y);
		return;
	}
	const good = delta >= 0;
	const text = `${good ? "+" : "-"} ${Math.abs(delta).toFixed(1)}% ${suffix}`;
	const color = good ? COLORS.validText : COLORS.dangerText;
	const bg = good ? COLORS.validBg : COLORS.dangerBg;

	font(doc, 7, "bold", color);
	const w = doc.getTextWidth(text) + 3.4;
	fill(doc, bg);
	doc.roundedRect(x, y - 3.1, w, 4.4, 2.2, 2.2, "F");
	font(doc, 7, "bold", color);
	doc.text(text, x + 1.7, y);
}

function drawHeader(doc: jsPDF, data: SalesReportPdfData) {
	fill(doc, COLORS.primary);
	doc.roundedRect(M, 13, 9, 9, 2.2, 2.2, "F");
	font(doc, 12, "bold", COLORS.white);
	doc.text("N", M + 4.5, 19, { align: "center" });

	font(doc, 15, "bold", COLORS.textH);
	doc.text("Sales Report", M + 12, 17.4);
	font(doc, 8, "normal", COLORS.text);
	doc.text(data.subtitle, M + 12, 21.6);

	font(doc, 9.5, "bold", COLORS.textH);
	doc.text(fitText(doc, data.periodLabel, 130), RIGHT, 17.4, {
		align: "right",
	});
	font(doc, 7.5, "normal", COLORS.text);
	doc.text(fitText(doc, data.generatedLabel, 112), RIGHT, 21.6, {
		align: "right",
	});

	stroke(doc, COLORS.border, 0.3);
	doc.line(M, Y_HEADER_RULE, RIGHT, Y_HEADER_RULE);
}

function drawSummary(doc: jsPDF, data: SalesReportPdfData) {
	const s = data.summary;
	const colW = (RIGHT - M) / 4;
	const cards: { label: string; value: string; delta: number | null }[] = [
		{
			label: "Total Revenue",
			value: formatIdr(s.revenue),
			delta: s.revenueDelta,
		},
		{
			label: "Transactions",
			value: s.transactions.toLocaleString("en-US"),
			delta: s.transactionsDelta,
		},
		{
			label: "Avg Order Value",
			value: formatIdr(s.avgOrder),
			delta: s.avgDelta,
		},
		{
			label: "Units Sold",
			value: s.unitsSold.toLocaleString("en-US"),
			delta: null,
		},
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
		if (card.label === "Units Sold") {
			font(doc, 7, "normal", COLORS.text);
			doc.text(
				`${s.variants.toLocaleString("en-US")} variants`,
				x,
				Y_SUMMARY_DELTA,
			);
		} else {
			drawDelta(doc, x, Y_SUMMARY_DELTA, card.delta);
		}
	});
}

function formatMillions(value: number): string {
	return (value / 1e6).toFixed(1);
}

function drawTrend(doc: jsPDF, data: SalesReportPdfData) {
	font(doc, 10.5, "bold", COLORS.textH);
	doc.text("Sales Trend", M, Y_TREND_TITLE);
	font(doc, 7.5, "normal", COLORS.text);
	doc.text(fitText(doc, data.trendSubtitle, 118), RIGHT, Y_TREND_TITLE, {
		align: "right",
	});

	const points = data.trend;
	const plotW = RIGHT - M;
	const plotH = Y_CHART_BASE - Y_CHART_TOP;
	const max = Math.max(1, ...points.map((point) => point.value));

	stroke(doc, COLORS.border, 0.25);
	doc.line(M, Y_CHART_BASE, RIGHT, Y_CHART_BASE);

	if (points.length === 0) return;

	const slot = plotW / points.length;
	const barW = Math.min(slot * 0.62, 9);
	const showValues = points.length <= 12;
	points.forEach((point, index) => {
		const h = Math.max(0.4, (point.value / max) * plotH);
		const x = M + slot * index + (slot - barW) / 2;
		const center = M + slot * (index + 0.5);
		const isPeak = point.value === max;
		fill(doc, isPeak ? COLORS.primary : COLORS.primarySoft);
		doc.roundedRect(x, Y_CHART_BASE - h, barW, h, 0.8, 0.8, "F");

		if (showValues) {
			font(
				doc,
				5.6,
				isPeak ? "bold" : "normal",
				isPeak ? COLORS.primary : COLORS.text,
			);
			doc.text(formatMillions(point.value), center, Y_CHART_BASE - h - 1.2, {
				align: "center",
			});
		}

		font(
			doc,
			7.5,
			isPeak ? "bold" : "normal",
			isPeak ? COLORS.primary : COLORS.text,
		);
		doc.text(point.label, center, Y_CHART_LABELS, {
			align: "center",
		});
	});
}

interface Column {
	label: string;
	x: number;
	align: "left" | "right";
}

function drawTableHeader(
	doc: jsPDF,
	x: number,
	w: number,
	columns: Column[],
	y: number,
) {
	font(doc, 6.5, "bold", COLORS.text);
	for (const column of columns) {
		doc.text(column.label.toUpperCase(), column.x, y, { align: column.align });
	}
	stroke(doc, COLORS.border, 0.25);
	doc.line(x, y + 1.6, x + w, y + 1.6);
}

function drawTableTitle(doc: jsPDF, title: string, x: number, y: number) {
	font(doc, 10.5, "bold", COLORS.textH);
	doc.text(title, x, y);
}

function drawProductTable(doc: jsPDF, rows: PdfProductRow[]) {
	drawTableTitle(doc, "Top Selling Products", M, Y_TABLE_A_TITLE);
	const columns: Column[] = [
		{ label: "Product", x: M, align: "left" },
		{ label: "Sold", x: M + 51, align: "right" },
		{ label: "Revenue", x: M + 71, align: "right" },
		{ label: "Share", x: M + LEFT_W, align: "right" },
	];
	drawTableHeader(doc, M, LEFT_W, columns, Y_TABLE_A_HEADER);
	rows.forEach((row, index) => {
		const y = Y_TABLE_A_ROW + index * ROW_H;
		font(doc, 7.5, "bold", COLORS.textH);
		doc.text(fitText(doc, row.name, 36), M, y);
		font(doc, 7.5, "normal", COLORS.textH);
		doc.text(row.qty.toLocaleString("en-US"), M + 51, y, { align: "right" });
		doc.text(formatCompactIdr(row.revenue), M + 71, y, { align: "right" });
		font(doc, 7.5, "bold", COLORS.primary);
		doc.text(`${row.share.toFixed(1)}%`, M + LEFT_W, y, { align: "right" });
		if (index < rows.length - 1) {
			stroke(doc, COLORS.border, 0.2);
			doc.line(M, y + 1.7, M + LEFT_W, y + 1.7);
		}
	});
}

function drawCategoryTable(doc: jsPDF, rows: PdfCategoryRow[]) {
	drawTableTitle(doc, "Revenue by Category", RIGHT_X, Y_TABLE_A_TITLE);
	const x = RIGHT_X;
	const w = RIGHT_W;
	font(doc, 6.5, "bold", COLORS.text);
	doc.text("CATEGORY", x, Y_TABLE_A_HEADER);
	doc.text("REVENUE", x + w - 16, Y_TABLE_A_HEADER, { align: "right" });
	doc.text("SHARE", x + w, Y_TABLE_A_HEADER, { align: "right" });
	stroke(doc, COLORS.border, 0.25);
	doc.line(x, Y_TABLE_A_HEADER + 1.6, x + w, Y_TABLE_A_HEADER + 1.6);

	rows.forEach((row, index) => {
		const y = Y_TABLE_A_ROW + index * ROW_H;
		font(doc, 7.5, "bold", COLORS.textH);
		doc.text(fitText(doc, row.name, 53), x, y);
		font(doc, 7.5, "normal", COLORS.textH);
		doc.text(formatCompactIdr(row.revenue), x + w - 16, y, { align: "right" });
		font(doc, 7.5, "bold", COLORS.primary);
		doc.text(`${row.share.toFixed(1)}%`, x + w, y, { align: "right" });

		fill(doc, COLORS.track);
		doc.roundedRect(x, y + 1.3, w, 1.3, 0.65, 0.65, "F");
		fill(doc, COLORS.primary);
		doc.roundedRect(
			x,
			y + 1.3,
			(w * Math.min(row.share, 100)) / 100,
			1.3,
			0.65,
			0.65,
			"F",
		);
	});
}

function drawMethodTable(doc: jsPDF, rows: PdfMethodRow[]) {
	drawTableTitle(doc, "Payment Methods", M, Y_TABLE_B_TITLE);
	const columns: Column[] = [
		{ label: "Method", x: M, align: "left" },
		{ label: "Txn", x: M + 51, align: "right" },
		{ label: "Revenue", x: M + 71, align: "right" },
		{ label: "Share", x: M + LEFT_W, align: "right" },
	];
	drawTableHeader(doc, M, LEFT_W, columns, Y_TABLE_B_HEADER);
	rows.forEach((row, index) => {
		const y = Y_TABLE_B_ROW + index * ROW_H;
		font(doc, 7.5, "bold", COLORS.textH);
		doc.text(fitText(doc, row.name, 36), M, y);
		font(doc, 7.5, "normal", COLORS.textH);
		doc.text(row.txn.toLocaleString("en-US"), M + 51, y, { align: "right" });
		doc.text(formatCompactIdr(row.revenue), M + 71, y, { align: "right" });
		font(doc, 7.5, "bold", COLORS.primary);
		doc.text(`${row.share.toFixed(1)}%`, M + LEFT_W, y, { align: "right" });
		if (index < rows.length - 1) {
			stroke(doc, COLORS.border, 0.2);
			doc.line(M, y + 1.7, M + LEFT_W, y + 1.7);
		}
	});
}

function drawCashierTable(doc: jsPDF, rows: PdfCashierRow[]) {
	drawTableTitle(doc, "Cashier Performance", RIGHT_X, Y_TABLE_B_TITLE);
	const x = RIGHT_X;
	const w = RIGHT_W;
	font(doc, 6.5, "bold", COLORS.text);
	doc.text("CASHIER", x, Y_TABLE_B_HEADER);
	doc.text("TXN", x + w - 45, Y_TABLE_B_HEADER, { align: "right" });
	doc.text("REVENUE", x + w - 16, Y_TABLE_B_HEADER, { align: "right" });
	doc.text("SHARE", x + w, Y_TABLE_B_HEADER, { align: "right" });
	stroke(doc, COLORS.border, 0.25);
	doc.line(x, Y_TABLE_B_HEADER + 1.6, x + w, Y_TABLE_B_HEADER + 1.6);

	rows.forEach((row, index) => {
		const y = Y_TABLE_B_ROW + index * ROW_H;
		font(doc, 7.5, "bold", COLORS.textH);
		doc.text(fitText(doc, row.name, 30), x, y);
		font(doc, 6.5, "normal", COLORS.text);
		doc.text(fitText(doc, `@${row.username}`, 30), x, y + 2.6);
		font(doc, 7.5, "normal", COLORS.textH);
		doc.text(row.txn.toLocaleString("en-US"), x + w - 45, y, {
			align: "right",
		});
		doc.text(formatCompactIdr(row.revenue), x + w - 16, y, { align: "right" });
		font(doc, 7.5, "bold", COLORS.primary);
		doc.text(`${row.share.toFixed(1)}%`, x + w, y, { align: "right" });
		if (index < rows.length - 1) {
			stroke(doc, COLORS.border, 0.2);
			doc.line(x, y + 4.3, x + w, y + 4.3);
		}
	});
}

function drawStockTable(doc: jsPDF, rows: PdfStockRow[]) {
	drawTableTitle(doc, "Stock Alerts", M, Y_STOCK_TITLE);
	const columns: Column[] = [
		{ label: "Product", x: M, align: "left" },
		{ label: "In Stock", x: M + 110, align: "right" },
		{ label: "Sold", x: M + 130, align: "right" },
		{ label: "Status", x: RIGHT, align: "right" },
	];
	drawTableHeader(doc, M, RIGHT - M, columns, Y_STOCK_HEADER);
	rows.forEach((row, index) => {
		const y = Y_STOCK_ROW + index * ROW_H;
		font(doc, 7.5, "bold", COLORS.textH);
		doc.text(fitText(doc, row.name, 96), M, y);
		font(doc, 6.5, "normal", COLORS.text);
		doc.text(fitText(doc, row.code, 96), M, y + 2.5);
		font(doc, 7.5, "normal", COLORS.textH);
		doc.text(String(row.stock), M + 110, y, { align: "right" });
		doc.text(row.sold.toLocaleString("en-US"), M + 130, y, { align: "right" });

		const label =
			row.status === "out"
				? "Out of stock"
				: row.status === "low"
					? "Low"
					: "In stock";
		const color =
			row.status === "out"
				? COLORS.dangerText
				: row.status === "low"
					? COLORS.warnText
					: COLORS.validText;
		const bg =
			row.status === "out"
				? COLORS.dangerBg
				: row.status === "low"
					? COLORS.warnBg
					: COLORS.validBg;
		font(doc, 7, "bold", color);
		const w = doc.getTextWidth(label) + 4;
		fill(doc, bg);
		doc.roundedRect(RIGHT - w, y - 3.1, w, 4.4, 2.2, 2.2, "F");
		font(doc, 7, "bold", color);
		doc.text(label, RIGHT - w / 2, y, { align: "center" });

		if (index < rows.length - 1) {
			stroke(doc, COLORS.border, 0.2);
			doc.line(M, y + 4.3, RIGHT, y + 4.3);
		}
	});
}

function drawFooter(doc: jsPDF, data: SalesReportPdfData) {
	stroke(doc, COLORS.border, 0.3);
	doc.line(M, 281.2, RIGHT, 281.2);
	font(doc, 7, "normal", COLORS.text);
	doc.text(
		fitText(doc, "Nashta Group • Sales Report • Confidential", 95),
		M,
		288.4,
	);
	doc.text(fitText(doc, data.generatedLabel, 95), RIGHT, 288.4, {
		align: "right",
	});
}

export function drawSalesReport(doc: jsPDF, data: SalesReportPdfData) {
	fill(doc, COLORS.white);
	doc.rect(0, 0, PAGE_W, PAGE_H, "F");
	drawHeader(doc, data);
	drawSummary(doc, data);
	drawTrend(doc, data);
	drawProductTable(doc, data.topProducts);
	drawCategoryTable(doc, data.categories);
	drawMethodTable(doc, data.paymentMethods);
	drawCashierTable(doc, data.cashiers);
	drawStockTable(doc, data.stockAlerts);
	drawFooter(doc, data);
}

export async function downloadSalesReportPdf(
	data: SalesReportPdfData,
	filename: string,
): Promise<void> {
	const { jsPDF: JsPdf } = await import("jspdf");
	const doc = new JsPdf({ unit: "mm", format: "a4", orientation: "portrait" });
	drawSalesReport(doc, data);
	doc.save(filename);
}
