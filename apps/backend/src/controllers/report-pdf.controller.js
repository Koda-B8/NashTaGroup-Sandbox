import PDFKit from "pdfkit";

import { createHttpError } from "../utils/http-error.js";
import {
	getCashierReport,
	getCustomerReport,
	getInventoryReport,
	getPaymentMethodReport,
	getProductReport,
	getSalesReport,
} from "./report.controller.js";

const PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 5000;
const MONEY_FIELDS = new Set([
	"gross_sales",
	"discount_amount",
	"tax_amount",
	"total_sales",
	"average_transaction",
	"total_spent",
	"non_member_total_sales",
	"subtotal",
	"collected_amount",
	"cash_tendered",
	"change_given",
	"payment_gap",
]);
const LABELS = {
	transactions: "Transaksi",
	transaction_count: "Jumlah transaksi",
	member_transactions: "Transaksi member",
	non_member_transactions: "Transaksi nonmember",
	active_members: "Member aktif",
	paid_transaction_count: "Transaksi dibayar",
	missing_payment_count: "Tanpa pembayaran lunas",
	gross_sales: "Penjualan bruto",
	discount_amount: "Diskon",
	tax_amount: "Pajak",
	total_sales: "Total penjualan",
	average_transaction: "Rata-rata transaksi",
	non_member_total_sales: "Penjualan nonmember",
	total_spent: "Total belanja",
	collected_amount: "Pembayaran tercatat",
	cash_tendered: "Uang tunai diterima",
	change_given: "Kembalian",
	payment_gap: "Selisih pembayaran",
	variants: "Varian produk",
	current_stock: "Stok saat ini",
	units_sold: "Unit terjual",
	stock_in: "Stok masuk",
	stock_out: "Stok keluar",
	corrections: "Koreksi stok",
	quantity: "Jumlah",
	subtotal: "Subtotal",
	last_transaction_at: "Transaksi terakhir",
	created_at: "Waktu",
	period_start: "Awal periode",
	is_active: "Aktif",
};

const REPORTS = {
	"customers": {
		title: "Laporan Pelanggan",
		handler: getCustomerReport,
		list: "members",
		listTitle: "Member",
		name: (row) => row.name,
		fields: [
			"phone",
			"transaction_count",
			"total_spent",
			"last_transaction_at",
		],
		extra: {
			key: "non_member_products",
			title: "Produk Nonmember",
			name: (row) => row.product_name,
			fields: ["product_code", "quantity", "subtotal"],
		},
	},
	"products": {
		title: "Laporan Produk",
		handler: getProductReport,
		list: "items",
		listTitle: "Varian Produk",
		name: (row) => `${row.product_name} / ${row.variant_name}`,
		fields: [
			"product_code",
			"transaction_count",
			"units_sold",
			"gross_sales",
			"current_stock",
			"stock_in",
			"stock_out",
			"corrections",
		],
		extra: {
			key: "transactions",
			title: "Transaksi Produk Terakhir (maks. 30)",
			name: (row) => `${row.transaction_number} / ${row.product_name}`,
			fields: ["created_at", "customer_name", "qty", "subtotal"],
		},
	},
	"inventory": {
		title: "Laporan Inventaris",
		handler: getInventoryReport,
		list: "items",
		listTitle: "Varian Produk",
		name: (row) => `${row.product_name} / ${row.variant_name}`,
		fields: [
			"product_code",
			"current_stock",
			"stock_in",
			"stock_out",
			"corrections",
			"units_sold",
		],
		extra: {
			key: "movements",
			title: "Pergerakan Stok Terakhir (maks. 30)",
			name: (row) => `${row.product_name} / ${row.variant_name}`,
			fields: [
				"created_at",
				"type",
				"quantity",
				"stock_before",
				"stock_after",
				"performed_by",
				"note",
			],
		},
	},
	"sales": {
		title: "Laporan Penjualan",
		handler: getSalesReport,
		list: "rows",
		listTitle: "Penjualan per Periode",
		name: (row) => row.period_start,
		fields: [
			"transaction_count",
			"gross_sales",
			"discount_amount",
			"tax_amount",
			"total_sales",
			"average_transaction",
		],
	},
	"payment-methods": {
		title: "Laporan Metode Pembayaran",
		handler: getPaymentMethodReport,
		list: "methods",
		listTitle: "Metode Pembayaran",
		name: (row) => row.name,
		fields: [
			"code",
			"type",
			"is_active",
			"transaction_count",
			"gross_sales",
			"total_sales",
			"collected_amount",
			"cash_tendered",
			"change_given",
			"payment_gap",
			"last_transaction_at",
		],
	},
	"cashiers": {
		title: "Laporan Kasir",
		handler: getCashierReport,
		list: "cashiers",
		listTitle: "Kasir",
		name: (row) => row.fullname,
		fields: [
			"username",
			"role",
			"transaction_count",
			"member_transactions",
			"non_member_transactions",
			"paid_transaction_count",
			"gross_sales",
			"total_sales",
			"average_transaction",
			"collected_amount",
			"payment_gap",
			"last_transaction_at",
		],
	},
};

const integer = new Intl.NumberFormat("id-ID", {
	maximumFractionDigits: 0,
});
const dateTime = new Intl.DateTimeFormat("id-ID", {
	timeZone: "Asia/Jakarta",
	dateStyle: "medium",
	timeStyle: "short",
});

function valueText(key, value) {
	if (value === null || value === undefined || value === "") return "-";
	if (MONEY_FIELDS.has(key)) {
		const amount = String(value);
		const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount);
		if (!match) return amount;
		return `${match[1] ? "-" : ""}Rp ${integer.format(BigInt(match[2]))},${(match[3] ?? "0").padEnd(2, "0")}`;
	}
	if (key.endsWith("_at")) return dateTime.format(new Date(value));
	if (typeof value === "boolean") return value ? "Ya" : "Tidak";
	return String(value);
}

function writeFields(doc, row, fields) {
	for (const key of fields) {
		if (!(key in row)) continue;
		doc
			.font("Helvetica")
			.fontSize(9)
			.fillColor("#333333")
			.text(
				`${LABELS[key] ?? key.replaceAll("_", " ")}: ${valueText(key, row[key])}`,
				{ indent: 10 },
			);
	}
}

function writeSection(doc, title, rows, config) {
	doc
		.moveDown(0.7)
		.font("Helvetica-Bold")
		.fontSize(12)
		.fillColor("#162c43")
		.text(title);
	if (rows.length === 0) {
		doc
			.font("Helvetica")
			.fontSize(9)
			.fillColor("#555555")
			.text("Tidak ada data.");
		return;
	}
	for (const [index, row] of rows.entries()) {
		doc
			.moveDown(0.45)
			.font("Helvetica-Bold")
			.fontSize(10)
			.fillColor("#111111")
			.text(`${index + 1}. ${config.name(row) ?? "-"}`);
		writeFields(doc, row, config.fields);
		if (Array.isArray(row.products) && row.products.length > 0) {
			doc
				.font("Helvetica-Bold")
				.fontSize(9)
				.text("Produk dibeli:", { indent: 10 });
			for (const product of row.products) {
				doc
					.font("Helvetica")
					.fontSize(9)
					.text(
						`${product.product_name} x${product.quantity} - ${valueText("subtotal", product.subtotal)}`,
						{ indent: 20 },
					);
			}
		}
	}
}

async function loadPage(handler, request, page) {
	let result;
	const response = {
		status() {
			return this;
		},
		json(body) {
			result = body;
			return this;
		},
	};
	await handler(
		{
			...request,
			query: {
				from: request.query.from,
				to: request.query.to,
				period: request.query.period,
				page: String(page),
				limit: String(PAGE_SIZE),
			},
		},
		response,
		(error) => {
			throw error;
		},
	);
	if (!result?.data || !result.meta?.pagination) {
		throw new Error("Report did not return exportable data");
	}
	return result;
}

async function loadExportData(config, request) {
	const first = await loadPage(config.handler, request, 1);
	const total = first.meta.pagination.total_items;
	if (total > MAX_EXPORT_ROWS) {
		throw createHttpError(
			413,
			`PDF export is limited to ${MAX_EXPORT_ROWS} rows; narrow the date range`,
		);
	}
	const data = first.data;
	for (let page = 2; page <= Math.ceil(total / PAGE_SIZE); page++) {
		const next = await loadPage(config.handler, request, page);
		data[config.list].push(...next.data[config.list]);
	}
	return data;
}

function createPdf(config, request, data) {
	return new Promise((resolve, reject) => {
		const doc = new PDFKit({
			size: "A4",
			margin: 42,
			info: { Title: config.title, Author: "NashTa Group" },
		});
		const chunks = [];
		doc.on("data", (chunk) => chunks.push(chunk));
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);
		try {
			doc
				.font("Helvetica-Bold")
				.fontSize(18)
				.fillColor("#162c43")
				.text(config.title);
			doc
				.font("Helvetica")
				.fontSize(9)
				.fillColor("#555555")
				.text(
					`Periode: ${request.query.from ?? "Awal"} s.d. ${request.query.to ?? "Sekarang"} (WIB)`,
				)
				.text(`Dibuat: ${dateTime.format(new Date())} WIB`);
			if (data.period) doc.text(`Pengelompokan: ${data.period}`);
			doc
				.moveDown(0.7)
				.font("Helvetica-Bold")
				.fontSize(12)
				.fillColor("#162c43")
				.text("Ringkasan");
			writeFields(
				doc,
				data.summary,
				Object.keys(data.summary).filter(
					(key) => key !== "revenue" && key !== "non_member_revenue",
				),
			);
			writeSection(doc, config.listTitle, data[config.list], config);
			if (config.extra)
				writeSection(
					doc,
					config.extra.title,
					data[config.extra.key],
					config.extra,
				);
			doc.end();
		} catch (error) {
			doc.destroy();
			reject(error);
		}
	});
}

export async function exportReportPdf(request, response, next) {
	try {
		if (!Object.hasOwn(REPORTS, request.params.report)) {
			throw createHttpError(404, "Report not found");
		}
		const config = REPORTS[request.params.report];
		const data = await loadExportData(config, request);
		const pdf = await createPdf(config, request, data);
		const date = new Date().toLocaleDateString("en-CA", {
			timeZone: "Asia/Jakarta",
		});
		response.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="report-${request.params.report}-${date}.pdf"`,
			"Content-Length": pdf.length,
			"Cache-Control": "no-store",
		});
		return response.send(pdf);
	} catch (error) {
		return next(error);
	}
}
