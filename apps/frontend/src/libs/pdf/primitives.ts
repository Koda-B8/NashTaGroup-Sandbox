import type { jsPDF } from "jspdf";

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
	infoText: [109, 40, 217],
	infoBg: [237, 233, 254],
	white: [255, 255, 255],
} as const;

export function font(
	doc: jsPDF,
	size: number,
	style: "normal" | "bold" = "normal",
	color: Rgb = COLORS.text,
) {
	doc.setFont("helvetica", style);
	doc.setFontSize(size);
	doc.setTextColor(color[0], color[1], color[2]);
}

export function fill(doc: jsPDF, color: Rgb) {
	doc.setFillColor(color[0], color[1], color[2]);
}

export function stroke(doc: jsPDF, color: Rgb, width = 0.25) {
	doc.setDrawColor(color[0], color[1], color[2]);
	doc.setLineWidth(width);
}

export function fitText(doc: jsPDF, text: string, maxWidth: number): string {
	if (doc.getTextWidth(text) <= maxWidth) return text;
	let cut = text;
	while (cut.length > 0 && doc.getTextWidth(`${cut}...`) > maxWidth) {
		cut = cut.slice(0, -1);
	}
	return cut.length > 0 ? `${cut}...` : text.slice(0, 1);
}

/**
 * jsPDF's built-in fonts use WinAnsi (Latin-1) encoding, so glyphs such as
 * arrows, en/em dashes, and curly quotes render as garbage. Map them to safe
 * equivalents before drawing so exported text stays readable.
 */
export function safePdfText(value: string): string {
	return value
		.replaceAll('→', "->")
		.replaceAll('←', "<-")
		.replaceAll(/[–—]/g, "-")
		.replaceAll('•', "·")
		.replaceAll(/[’‘]/g, "'")
		.replaceAll(/[“”]/g, '"')
		.replaceAll(/[^\u0020-\u00FF]/g, "?");
}
