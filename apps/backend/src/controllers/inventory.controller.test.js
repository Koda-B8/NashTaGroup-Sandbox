import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { getInventories } from "./inventory.controller.js";

vi.mock("../lib/pagination.js", () => ({
	paginate: vi.fn(),
}));

vi.mock("../models/index.cjs", () => ({
	default: {
		Brands: {},
		Categories: {},
		Inventories: {},
		ProductItems: {},
		Products: {},
	},
}));

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

const createProductItem = (stock) => ({
	toJSON: () => ({
		id: "b5cbf379-0cfb-43d4-a2f3-3ddf76b4d7a3",
		productCode: "SAM-A55-128-NVY",
		name: "8GB/128GB - Awesome Navy",
		inventory: { stock },
		product: {
			name: "Galaxy A55",
			brand: { name: "Samsung" },
			category: { name: "Smartphone" },
		},
	}),
});

describe("inventory controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns paginated inventories with low stock status", async () => {
		const productItem = createProductItem(5);
		const response = createResponse();
		const next = vi.fn();

		vi.mocked(paginate).mockResolvedValue({
			rows: [productItem],
			pagination: {
				page: 1,
				limit: 20,
				total_items: 1,
				total_pages: 1,
			},
		});

		await getInventories(
			{
				query: {
					page: "1",
					limit: "20",
					q: "Galaxy",
					category_id: "d96a9f52-b82f-411e-8ee4-1571318d15a3",
					brand_id: "bc15e763-3f1d-47ec-842c-7563e5e7fe54",
					stock_status: "low",
				},
			},
			response,
			next,
		);

		expect(paginate).toHaveBeenCalledWith(
			db.ProductItems,
			expect.any(Object),
			expect.any(Object),
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.include[0].where).toEqual({
			stock: {
				[Op.between]: [1, 9],
			},
		});

		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Inventories retrieved successfully",
			data: [
				{
					product_item_id: "b5cbf379-0cfb-43d4-a2f3-3ddf76b4d7a3",
					product_code: "SAM-A55-128-NVY",
					product_name: "Galaxy A55",
					variant_name: "8GB/128GB - Awesome Navy",
					brand: "Samsung",
					category: "Smartphone",
					stock: 5,
					stock_status: "low",
				},
			],
			meta: {
				pagination: {
					page: 1,
					limit: 20,
					total_items: 1,
					total_pages: 1,
				},
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("maps zero stock as out_of_stock and stock of ten as available", async () => {
		const response = createResponse();
		const next = vi.fn();

		vi.mocked(paginate).mockResolvedValue({
			rows: [createProductItem(0), createProductItem(10)],
			pagination: {
				page: 1,
				limit: 20,
				total_items: 2,
				total_pages: 1,
			},
		});

		await getInventories({ query: {} }, response, next);

		const responseBody = response.json.mock.calls[0][0];

		expect(responseBody.data[0].stock_status).toBe("out_of_stock");
		expect(responseBody.data[1].stock_status).toBe("available");
	});

	it.each([
		["category_id", "not-a-uuid", "category_id must be a valid UUID"],
		["brand_id", "not-a-uuid", "brand_id must be a valid UUID"],
	])("passes a 400 error for invalid %s", async (field, value, message) => {
		const response = createResponse();
		const next = vi.fn();

		await getInventories(
			{
				query: {
					[field]: value,
				},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message,
			}),
		);
		expect(paginate).not.toHaveBeenCalled();
	});

	it("passes a 400 error for an unsupported stock status", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getInventories(
			{
				query: {
					stock_status: "empty",
				},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "stock_status must be available, low, or out_of_stock",
			}),
		);
		expect(paginate).not.toHaveBeenCalled();
	});

	it("passes unexpected errors to the error middleware", async () => {
		const response = createResponse();
		const next = vi.fn();
		const error = new Error("database unavailable");

		vi.mocked(paginate).mockRejectedValue(error);

		await getInventories({ query: {} }, response, next);

		expect(next).toHaveBeenCalledWith(error);
	});
});
