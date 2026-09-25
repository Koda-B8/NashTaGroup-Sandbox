import { createHttpError } from "../utils/http-error.js";
import { getCustomerDetailReport } from "./customer-report.controller.js";
import { getProductDetailReport } from "./product-report.controller.js";
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
const REPORTS = {
	"customers": { handler: getCustomerReport, list: "members" },
	"products": { handler: getProductReport, list: "items" },
	"inventory": { handler: getInventoryReport, list: "items" },
	"sales": { handler: getSalesReport, list: "rows" },
	"payment-methods": { handler: getPaymentMethodReport, list: "methods" },
	"cashiers": { handler: getCashierReport, list: "cashiers" },
};

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
				view: request.query.view,
				page: String(page),
				limit: String(PAGE_SIZE),
			},
		},
		response,
		(error) => {
			throw error;
		},
	);
	// @ts-ignore
	if (!result?.data || !result.meta?.pagination) {
		throw new Error("Report did not return exportable data");
	}
	return result;
}

export async function exportReportData(request, response, next) {
	try {
		if (!Object.hasOwn(REPORTS, request.params.report)) {
			throw createHttpError(404, "Report not found");
		}
		const config = REPORTS[request.params.report];
		const first = await loadPage(config.handler, request, 1);
		// @ts-ignore
		const total = first.meta.pagination.total_items;
		if (total > MAX_EXPORT_ROWS) {
			throw createHttpError(
				413,
				`Report export is limited to ${MAX_EXPORT_ROWS} main rows; narrow the date range`,
			);
		}
		// @ts-ignore
		const data = first.data;
		for (let page = 2; page <= Math.ceil(total / PAGE_SIZE); page++) {
			const nextPage = await loadPage(config.handler, request, page);
			// @ts-ignore
			data[config.list].push(...nextPage.data[config.list]);
		}
		response.set("Cache-Control", "no-store");
		return response.status(200).json({
			success: true,
			message: "Report export data retrieved successfully",
			data,
			meta: {
				export: {
					row_count: data[config.list].length,
					max_rows: MAX_EXPORT_ROWS,
				},
			},
		});
	} catch (error) {
		return next(error);
	}
}

async function exportDetailReport(request, response, next, handler, label) {
	try {
		const view = request.query.view ?? "transactions";
		const first = await loadPage(handler, request, 1);
		// @ts-ignore
		const total = first.meta.pagination.total_items;
		if (total > MAX_EXPORT_ROWS) {
			throw createHttpError(
				413,
				`Report export is limited to ${MAX_EXPORT_ROWS} rows; narrow the date range`,
			);
		}
		// @ts-ignore
		const data = first.data;
		for (let page = 2; page <= Math.ceil(total / PAGE_SIZE); page++) {
			const nextPage = await loadPage(handler, request, page);
			// @ts-ignore
			data[view].push(...nextPage.data[view]);
		}
		response.set("Cache-Control", "no-store");
		return response.status(200).json({
			success: true,
			message: `${label} report export data retrieved successfully`,
			data,
			meta: {
				export: {
					row_count: data[view].length,
					max_rows: MAX_EXPORT_ROWS,
				},
			},
		});
	} catch (error) {
		return next(error);
	}
}

export const exportProductDetailReport = (request, response, next) =>
	exportDetailReport(
		request,
		response,
		next,
		getProductDetailReport,
		"Product",
	);

export const exportCustomerDetailReport = (request, response, next) =>
	exportDetailReport(
		request,
		response,
		next,
		getCustomerDetailReport,
		"Customer",
	);
