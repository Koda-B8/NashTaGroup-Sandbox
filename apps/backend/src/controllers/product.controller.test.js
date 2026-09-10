import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import {
	createProduct,
	deleteProduct,
	getProducts,
	updateProduct,
} from "./product.controller.js";

vi.mock("../models/index.cjs", () => ({
	default: {
		Brands: { findByPk: vi.fn() },
		Categories: { findByPk: vi.fn() },
		ProductItems: {},
		Products: {
			create: vi.fn(),
			findAll: vi.fn(),
			findByPk: vi.fn(),
		},
	},
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const brandId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";

const activeCategory = {
	id: categoryId,
	name: "Smartphone",
	isActive: true,
};

const activeBrand = {
	id: brandId,
	name: "Samsung",
	isActive: true,
};

const product = {
	id: productId,
	categoryId,
	brandId,
	name: "Samsung Galaxy A55",
	description: "Samsung Galaxy A55 smartphone.",
	isActive: true,
};

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("product controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		db.Categories.findByPk.mockResolvedValue(activeCategory);
		db.Brands.findByPk.mockResolvedValue(activeBrand);
	});

	it("retrieves products with search and filters", async () => {
		db.Products.findAll.mockResolvedValue([product]);
		const response = createResponse();
		const next = vi.fn();

		await getProducts(
			{
				query: {
					search: "Galaxy",
					categoryId,
					brandId,
					isActive: "true",
				},
			},
			response,
			next,
		);

		const options = db.Products.findAll.mock.calls[0][0];

		expect(options.where.categoryId).toBe(categoryId);
		expect(options.where.brandId).toBe(brandId);
		expect(options.where.isActive).toBe(true);
		expect(options.where.name[Op.iLike]).toBe("%Galaxy%");
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Products retrieved successfully",
			data: [product],
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("creates a product with valid category and brand", async () => {
		db.Products.create.mockResolvedValue({ id: productId });
		db.Products.findByPk.mockResolvedValue(product);

		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: "  Samsung   Galaxy A55  ",
					description: " Samsung Galaxy A55 smartphone. ",
				},
			},
			response,
			next,
		);

		expect(db.Categories.findByPk).toHaveBeenCalledWith(categoryId);
		expect(db.Brands.findByPk).toHaveBeenCalledWith(brandId);
		expect(db.Products.create).toHaveBeenCalledWith({
			categoryId,
			brandId,
			name: "Samsung Galaxy A55",
			description: "Samsung Galaxy A55 smartphone.",
			isActive: true,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product created successfully",
			data: product,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 400 when the product name is missing", async () => {
		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: "   ",
				},
			},
			response,
			next,
		);

		expect(db.Products.create).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Product name is required",
			}),
		);
	});

	it("returns 400 when the category is inactive", async () => {
		db.Categories.findByPk.mockResolvedValue({
			...activeCategory,
			isActive: false,
		});

		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: "Samsung Galaxy A55",
				},
			},
			response,
			next,
		);

		expect(db.Products.create).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Category is inactive",
			}),
		);
	});

	it("returns 400 when no valid update field is provided", async () => {
		db.Products.findByPk.mockResolvedValue({
			...product,
			update: vi.fn(),
		});

		const response = createResponse();
		const next = vi.fn();

		await updateProduct(
			{
				params: { id: productId },
				body: {},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "No valid field provided for update",
			}),
		);
	});

	it("soft deletes an existing product", async () => {
		const destroy = vi.fn();
		db.Products.findByPk.mockResolvedValue({
			...product,
			destroy,
		});

		const response = createResponse();
		const next = vi.fn();

		await deleteProduct({ params: { id: productId } }, response, next);

		expect(destroy).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});
