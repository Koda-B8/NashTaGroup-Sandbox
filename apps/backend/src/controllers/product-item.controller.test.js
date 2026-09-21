import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import {
	createProductItem,
	deleteProductItem,
	getProductItemById,
	getProductItems,
	updateProductItem,
} from "./product-item.controller.js";

const databaseMocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("../models/index.cjs", () => ({
	default: {
		Brands: {},
		Categories: {},
		CategoryAttributeOptions: {},
		CategoryAttributes: {},
		Inventories: {
			create: vi.fn(),
		},
		ProductImages: {},
		ProductItemAttributeValues: {
			bulkCreate: vi.fn(),
			destroy: vi.fn(),
		},
		ProductItems: {
			create: vi.fn(),
			findAll: vi.fn(),
			findByPk: vi.fn(),
			findOne: vi.fn(),
		},
		Products: {
			findByPk: vi.fn(),
		},
		sequelize: {
			transaction: databaseMocks.transaction,
		},
	},
}));

const productId = "33333333-3333-4333-8333-333333333333";
const productItemId = "44444444-4444-4444-8444-444444444444";

const product = {
	id: productId,
	name: "Samsung Galaxy A55",
	categoryId: "11111111-1111-4111-8111-111111111111",
	brandId: "22222222-2222-4222-8222-222222222222",
	isActive: true,
};

const productItem = {
	id: productItemId,
	productId,
	productCode: "SAM-A55-256-BLU",
	name: "Samsung Galaxy A55 256GB Blue",
	price: "6499000.00",
	isActive: true,
	inventory: { stock: 10 },
	product,
};

const productItemResponse = {
	id: productItemId,
	productId,
	productCode: "SAM-A55-256-BLU",
	name: "Samsung Galaxy A55 256GB Blue",
	price: "6499000.00",
	isActive: true,
	product,
	stock: 10,
};

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("product item controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		db.Products.findByPk.mockResolvedValue(product);
		db.ProductItems.findOne.mockResolvedValue(null);
		databaseMocks.transaction.mockImplementation((callback) =>
			callback({ id: "database-transaction" }),
		);
	});

	it("retrieves product items with search and filters", async () => {
		const itemImage = {
			imageUrl: "https://example.com/galaxy-a55-blue.webp",
			alt: "Samsung Galaxy A55 Blue",
			isPrimary: true,
			sortOrder: 0,
		};
		db.ProductItems.findAll.mockResolvedValue([
			{ ...productItem, images: [itemImage] },
		]);

		const response = createResponse();
		const next = vi.fn();

		await getProductItems(
			{
				query: {
					search: "A55",
					productId,
					isActive: "true",
				},
			},
			response,
			next,
		);

		const options = db.ProductItems.findAll.mock.calls[0][0];
		const productInclude = options.include.find(
			(include) => include.as === "product",
		);
		const itemImageInclude = options.include.find(
			(include) => include.as === "images",
		);

		expect(options.where.productId).toBe(productId);
		expect(options.where.isActive).toBe(true);
		expect(options.where[Op.or][0].name[Op.iLike]).toBe("%A55%");
		expect(options.where[Op.or][1].productCode[Op.iLike]).toBe("%A55%");
		expect(productInclude.include).toEqual([
			expect.objectContaining({ as: "images", required: false }),
		]);
		expect(itemImageInclude).toEqual(
			expect.objectContaining({ as: "images", required: false }),
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product items retrieved successfully",
			data: [
				{
					...productItemResponse,
					image: { alt: itemImage.alt, url: itemImage.imageUrl },
				},
			],
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("uses the product image when a product item has no image", async () => {
		const productImage = {
			imageUrl: "https://example.com/galaxy-a55.webp",
			alt: "Samsung Galaxy A55",
			isPrimary: true,
			sortOrder: 0,
		};
		db.ProductItems.findAll.mockResolvedValue([
			{
				...productItem,
				images: [],
				product: { ...product, images: [productImage] },
			},
		]);
		const response = createResponse();
		const next = vi.fn();

		await getProductItems({ query: {} }, response, next);

		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product items retrieved successfully",
			data: [
				{
					...productItemResponse,
					image: { alt: productImage.alt, url: productImage.imageUrl },
				},
			],
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("retrieves product item details with item and product images", async () => {
		const itemImage = {
			imageUrl: "https://example.com/galaxy-a55-blue.webp",
			alt: "Samsung Galaxy A55 Blue",
			isPrimary: true,
			sortOrder: 0,
		};
		const productImage = {
			imageUrl: "https://example.com/galaxy-a55.webp",
			alt: "Samsung Galaxy A55",
			isPrimary: true,
			sortOrder: 0,
		};
		const detailProduct = {
			...product,
			category: { id: product.categoryId, name: "Smartphone", isActive: true },
			brand: { id: product.brandId, name: "Samsung", isActive: true },
			images: [productImage],
		};
		db.ProductItems.findByPk.mockResolvedValue({
			...productItem,
			product: detailProduct,
			images: [itemImage],
		});
		const response = createResponse();
		const next = vi.fn();

		await getProductItemById({ params: { id: productItemId } }, response, next);

		const options = db.ProductItems.findByPk.mock.calls[0][1];
		const productInclude = options.include.find(
			(include) => include.as === "product",
		);
		const productImageInclude = productInclude.include.find(
			(include) => include.as === "images",
		);

		expect(productImageInclude.where).toEqual({ productItemId: null });
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product item retrieved successfully",
			data: {
				id: productItemId,
				productId,
				productCode: "SAM-A55-256-BLU",
				name: "Samsung Galaxy A55 256GB Blue",
				price: "6499000.00",
				isActive: true,
				stock: 10,
				image: { alt: itemImage.alt, url: itemImage.imageUrl },
				product: {
					...product,
					category: detailProduct.category,
					brand: detailProduct.brand,
					image: { alt: productImage.alt, url: productImage.imageUrl },
				},
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("creates a product item and normalizes the product code", async () => {
		db.ProductItems.create.mockResolvedValue({ id: productItemId });
		db.ProductItems.findByPk.mockResolvedValue(productItem);

		const response = createResponse();
		const next = vi.fn();

		await createProductItem(
			{
				body: {
					productId,
					productCode: " sam-a55-256-blu ",
					name: "  Samsung Galaxy A55 256GB Blue  ",
					price: "6499000.00",
					stock: 10,
				},
			},
			response,
			next,
		);

		expect(db.Products.findByPk).toHaveBeenCalledWith(
			productId,
			expect.objectContaining({ include: expect.any(Array) }),
		);
		expect(db.ProductItems.create).toHaveBeenCalledWith(
			{
				productId,
				productCode: "SAM-A55-256-BLU",
				name: "Samsung Galaxy A55 256GB Blue",
				price: "6499000.00",
				variantSignature: null,
				isActive: true,
			},
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.Inventories.create).toHaveBeenCalledWith(
			{ productItemId, stock: 10 },
			{ transaction: { id: "database-transaction" } },
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product item created successfully",
			data: productItemResponse,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("stores values for the attributes defined by the product category", async () => {
		const colorAttributeId = "55555555-5555-4555-8555-555555555555";
		const colorOptionId = "66666666-6666-4666-8666-666666666666";
		db.Products.findByPk.mockResolvedValue({
			...product,
			category: {
				id: product.categoryId,
				name: "Smartphone",
				attributes: [
					{
						id: colorAttributeId,
						name: "Color",
						isRequired: true,
						isVariant: true,
						sortOrder: 0,
						options: [{ id: colorOptionId, name: "Blue" }],
					},
				],
			},
		});
		db.ProductItems.create.mockResolvedValue({ id: productItemId });
		db.ProductItems.findByPk.mockResolvedValue({
			...productItem,
			attributeValues: [
				{
					categoryAttributeId: colorAttributeId,
					categoryAttributeOptionId: colorOptionId,
					value: "Blue",
					attribute: {
						id: colorAttributeId,
						name: "Color",
						isRequired: true,
						isVariant: true,
						sortOrder: 0,
					},
				},
			],
		});

		const response = createResponse();
		const next = vi.fn();
		await createProductItem(
			{
				body: {
					productId,
					productCode: "SAM-A55-BLU",
					name: "Samsung Galaxy A55 Blue",
					price: "6499000",
					attributes: [{ attributeId: colorAttributeId, value: " Blue " }],
				},
			},
			response,
			next,
		);

		expect(db.ProductItemAttributeValues.bulkCreate).toHaveBeenCalledWith(
			[
				{
					productItemId,
					categoryAttributeId: colorAttributeId,
					categoryAttributeOptionId: colorOptionId,
					value: "Blue",
				},
			],
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.ProductItems.create).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Blue" }),
			expect.any(Object),
		);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					attributes: [
						expect.objectContaining({
							id: colorAttributeId,
							name: "Color",
							value: "Blue",
						}),
					],
				}),
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects a duplicate variant combination for the same product", async () => {
		const colorAttributeId = "55555555-5555-4555-8555-555555555555";
		const colorOptionId = "66666666-6666-4666-8666-666666666666";
		db.Products.findByPk.mockResolvedValue({
			...product,
			category: {
				attributes: [
					{
						id: colorAttributeId,
						name: "Color",
						isRequired: true,
						isVariant: true,
						sortOrder: 0,
						options: [{ id: colorOptionId, name: "Blue" }],
					},
				],
			},
		});
		db.ProductItems.findOne.mockResolvedValue({ id: productItemId });
		const response = createResponse();
		const next = vi.fn();

		await createProductItem(
			{
				body: {
					productId,
					productCode: "SAM-A55-BLU-2",
					price: "6499000",
					attributes: [
						{ attributeId: colorAttributeId, optionId: colorOptionId },
					],
				},
			},
			response,
			next,
		);

		expect(db.ProductItems.create).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Product variant combination already exists",
			}),
		);
	});

	it.each([0, -1, "6499000.999", "invalid-price"])(
		"returns 400 for invalid price %p",
		async (price) => {
			const response = createResponse();
			const next = vi.fn();

			await createProductItem(
				{
					body: {
						productId,
						productCode: "SAM-A55-256-BLU",
						name: "Samsung Galaxy A55 256GB Blue",
						price,
					},
				},
				response,
				next,
			);

			expect(db.ProductItems.create).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: constants.HTTP_STATUS_BAD_REQUEST,
					message:
						"price must be a positive number with a maximum of 2 decimal places",
				}),
			);
		},
	);

	it.each([-1, 1.5, "10"])(
		"returns 400 for invalid stock %p",
		async (stock) => {
			const response = createResponse();
			const next = vi.fn();

			await createProductItem(
				{
					body: {
						productId,
						productCode: "SAM-A55-256-BLU",
						name: "Samsung Galaxy A55 256GB Blue",
						price: "6499000.00",
						stock,
					},
				},
				response,
				next,
			);

			expect(db.sequelize.transaction).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: constants.HTTP_STATUS_BAD_REQUEST,
					message: "stock must be a non-negative integer",
				}),
			);
		},
	);

	it("includes current stock when updating product item data", async () => {
		const update = vi.fn();
		db.ProductItems.findByPk
			.mockResolvedValueOnce({ ...productItem, update })
			.mockResolvedValueOnce(productItem);
		const response = createResponse();
		const next = vi.fn();

		await updateProductItem(
			{
				params: { id: productItemId },
				body: { price: "6599000.00" },
			},
			response,
			next,
		);

		expect(update).toHaveBeenCalledWith({ price: "6599000.00" });
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product item updated successfully",
			data: productItemResponse,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 409 when the product code already exists", async () => {
		db.ProductItems.create.mockRejectedValue(
			new UniqueConstraintError({
				message: "duplicate product code",
				errors: [],
			}),
		);

		const response = createResponse();
		const next = vi.fn();

		await createProductItem(
			{
				body: {
					productId,
					productCode: "SAM-A55-256-BLU",
					name: "Samsung Galaxy A55 256GB Blue",
					price: "6499000.00",
				},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Product code already exists",
			}),
		);
	});

	it("soft deletes an existing product item", async () => {
		const destroy = vi.fn();
		db.ProductItems.findByPk.mockResolvedValue({
			...productItem,
			destroy,
		});

		const response = createResponse();
		const next = vi.fn();

		await deleteProductItem({ params: { id: productItemId } }, response, next);

		expect(destroy).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product item deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});
