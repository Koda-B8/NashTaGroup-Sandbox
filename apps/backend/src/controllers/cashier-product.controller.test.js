import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import { getCashierProducts } from "./cashier-product.controller.js";

vi.mock("../models/index.cjs", () => ({
	default: {
		Brands: {},
		Categories: {},
		Inventories: {},
		ProductImages: {},
		ProductItems: { findAndCountAll: vi.fn() },
		Products: {},
	},
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const brandId = "22222222-2222-4222-8222-222222222222";

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("cashier product controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("retrieves paginated sellable SKUs with cashier filters", async () => {
		db.ProductItems.findAndCountAll.mockResolvedValue({
			count: 1,
			rows: [
				{
					id: "33333333-3333-4333-8333-333333333333",
					productId: "44444444-4444-4444-8444-444444444444",
					productCode: "SAM-A55-128-NVY",
					name: "8GB/128GB - Awesome Navy",
					price: "5999000.00",
					inventory: { stock: 10 },
					images: [
						{
							imageUrl: "https://example.com/a55-navy.webp",
							alt: "Samsung Galaxy A55 Awesome Navy",
							isPrimary: true,
						},
					],
					product: {
						name: "Samsung Galaxy A55",
						category: { id: categoryId, name: "Smartphone" },
						brand: { id: brandId, name: "Samsung" },
						images: [],
					},
				},
			],
		});
		const response = createResponse();
		const next = vi.fn();

		await getCashierProducts(
			{
				query: {
					page: "1",
					limit: "9",
					q: "Galaxy",
					category_id: categoryId,
					brand_id: brandId,
					min_price: "1000000",
					max_price: "7000000",
					in_stock: "true",
					sort: "price_asc",
				},
			},
			response,
			next,
		);

		const options = db.ProductItems.findAndCountAll.mock.calls[0][0];
		expect(options.limit).toBe(9);
		expect(options.offset).toBe(0);
		expect(options.where.isActive).toBe(true);
		expect(options.where.price[Op.gte]).toBe(1_000_000);
		expect(options.where.price[Op.lte]).toBe(7_000_000);
		expect(options.where[Op.or]).toHaveLength(3);
		expect(options.include[0].where.stock[Op.gt]).toBe(0);
		expect(options.include[2].where).toEqual({
			isActive: true,
			categoryId,
			brandId,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Cashier products retrieved successfully",
			data: [
				{
					product_item_id: "33333333-3333-4333-8333-333333333333",
					product_id: "44444444-4444-4444-8444-444444444444",
					product_code: "SAM-A55-128-NVY",
					name: "Samsung Galaxy A55",
					variant_name: "8GB/128GB - Awesome Navy",
					category: { id: categoryId, name: "Smartphone" },
					brand: { id: brandId, name: "Samsung" },
					price: "5999000.00",
					stock: 10,
					image: "https://example.com/a55-navy.webp",
					alt: "Samsung Galaxy A55 Awesome Navy",
					is_available: true,
				},
			],
			meta: {
				pagination: {
					page: 1,
					limit: 9,
					total_items: 1,
					total_pages: 1,
				},
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects an invalid price range", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getCashierProducts(
			{ query: { min_price: "200", max_price: "100" } },
			response,
			next,
		);

		expect(db.ProductItems.findAndCountAll).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "min_price must not be greater than max_price",
			}),
		);
	});
});
