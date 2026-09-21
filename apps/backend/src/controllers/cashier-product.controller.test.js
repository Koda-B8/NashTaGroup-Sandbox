import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import { getCashierProducts } from "./cashier-product.controller.js";

vi.mock("../models/index.cjs", () => ({
	default: {
		Brands: {},
		Categories: {},
		CategoryAttributeOptions: {},
		CategoryAttributes: {},
		Inventories: {},
		ProductImages: {},
		ProductItemAttributeValues: {},
		ProductItems: { findAll: vi.fn() },
		Products: { findAll: vi.fn() },
	},
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const brandId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";
const itemId = "44444444-4444-4444-8444-444444444444";
const colorId = "55555555-5555-4555-8555-555555555555";
const colorOptionId = "66666666-6666-4666-8666-666666666666";

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("cashier product controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns one product with attribute definitions and SKU items", async () => {
		db.ProductItems.findAll.mockResolvedValue([
			{
				productId,
				price: "5999000.00",
				product: { id: productId, name: "Samsung Galaxy A55" },
			},
		]);
		db.Products.findAll.mockResolvedValue([
			{
				id: productId,
				name: "Samsung Galaxy A55",
				description: "Smartphone",
				category: {
					id: categoryId,
					name: "Smartphone",
					attributes: [
						{
							id: colorId,
							name: "Color",
							isRequired: true,
							isVariant: true,
							sortOrder: 0,
							options: [
								{
									id: colorOptionId,
									name: "Blue",
									hex: "#3B82F6",
								},
							],
						},
					],
				},
				brand: { id: brandId, name: "Samsung" },
				images: [],
				items: [
					{
						id: itemId,
						productCode: "SAM-A55-BLU",
						name: "Blue",
						price: "5999000.00",
						isActive: true,
						inventory: { stock: 10 },
						images: [],
						attributeValues: [
							{
								categoryAttributeId: colorId,
								categoryAttributeOptionId: colorOptionId,
								value: "Blue",
								attribute: {
									id: colorId,
									name: "Color",
									isVariant: true,
									sortOrder: 0,
								},
							},
						],
					},
				],
			},
		]);
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

		const candidateOptions = db.ProductItems.findAll.mock.calls[0][0];
		expect(candidateOptions.where.isActive).toBe(true);
		expect(candidateOptions.where.price[Op.gte]).toBe(1_000_000);
		expect(candidateOptions.where.price[Op.lte]).toBe(7_000_000);
		expect(candidateOptions.where[Op.or]).toHaveLength(3);
		expect(candidateOptions.include[0].where.stock[Op.gt]).toBe(0);
		expect(candidateOptions.include[1].where).toEqual({
			isActive: true,
			categoryId,
			brandId,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Cashier products retrieved successfully",
			data: [
				expect.objectContaining({
					id: productId,
					name: "Samsung Galaxy A55",
					stock: 10,
					attributes: [
						expect.objectContaining({
							title: "Color",
							items: [
								{
									id: colorOptionId,
									name: "Blue",
									hex: "#3B82F6",
								},
							],
						}),
					],
					items: [
						expect.objectContaining({
							id: itemId,
							productCode: "SAM-A55-BLU",
							colorId: colorOptionId,
							specsId: "",
							priceDifference: "0.00",
						}),
					],
				}),
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

	it("calculates each SKU price difference from the cheapest SKU of the same color", async () => {
		const blueId = "66666666-6666-4666-8666-666666666666";
		const blackId = "77777777-7777-4777-8777-777777777777";
		const storageAttributeId = "88888888-8888-4888-8888-888888888888";
		const storage128Id = "99999999-9999-4999-8999-999999999999";
		const storage256Id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
		const variants = [
			{ color: blueId, storage: storage128Id, price: "10000000.00" },
			{ color: blueId, storage: storage256Id, price: "15000000.00" },
			{ color: blackId, storage: storage128Id, price: "11000000.25" },
			{ color: blackId, storage: storage256Id, price: "18000000.50" },
		];
		db.ProductItems.findAll.mockResolvedValue(
			variants.map(({ price }) => ({
				productId,
				price,
				product: { name: "Phone" },
			})),
		);
		db.Products.findAll.mockResolvedValue([
			{
				id: productId,
				name: "Phone",
				category: { id: categoryId, name: "Phone", attributes: [] },
				brand: { id: brandId, name: "Brand" },
				images: [],
				items: variants.map(({ color, storage, price }, index) => ({
					id: `item-${index}`,
					productCode: `PHONE-${index}`,
					name: `Variant ${index}`,
					price,
					isActive: true,
					inventory: { stock: 1 },
					images: [],
					attributeValues: [
						{
							categoryAttributeOptionId: color,
							attribute: { id: colorId, name: "Color" },
						},
						{
							categoryAttributeOptionId: storage,
							attribute: { id: storageAttributeId, name: "Storage" },
						},
					],
				})),
			},
		]);
		const response = createResponse();
		const next = vi.fn();

		await getCashierProducts({ query: {} }, response, next);

		const items = response.json.mock.calls[0][0].data[0].items;
		expect(
			items.map(({ colorId: color, specsId, priceDifference }) => ({
				color,
				specsId,
				priceDifference,
			})),
		).toEqual([
			{ color: blueId, specsId: storage128Id, priceDifference: "0.00" },
			{ color: blueId, specsId: storage256Id, priceDifference: "5000000.00" },
			{ color: blackId, specsId: storage128Id, priceDifference: "0.00" },
			{ color: blackId, specsId: storage256Id, priceDifference: "7000000.25" },
		]);
		expect(next).not.toHaveBeenCalled();
	});

	it("paginates unique products instead of individual SKU rows", async () => {
		db.ProductItems.findAll.mockResolvedValue([
			{ productId, price: "100", product: { name: "Product A" } },
			{ productId, price: "200", product: { name: "Product A" } },
		]);
		db.Products.findAll.mockResolvedValue([]);
		const response = createResponse();
		const next = vi.fn();

		await getCashierProducts({ query: {} }, response, next);

		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				meta: {
					pagination: expect.objectContaining({ total_items: 1 }),
				},
			}),
		);
	});

	it("rejects an invalid price range", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getCashierProducts(
			{ query: { min_price: "200", max_price: "100" } },
			response,
			next,
		);

		expect(db.ProductItems.findAll).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "min_price must not be greater than max_price",
			}),
		);
	});
});
