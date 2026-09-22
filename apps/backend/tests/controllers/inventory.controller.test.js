import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	adjustStock,
	getInventories,
} from "../../src/controllers/inventory.controller.js";
import { emitInventoryUpdated } from "../../src/lib/inventory-realtime.js";
import { paginate } from "../../src/lib/pagination.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/lib/inventory-realtime.js", () => ({
	emitInventoryUpdated: vi.fn(),
}));

vi.mock("../../src/lib/pagination.js", () => ({
	paginate: vi.fn(),
}));

vi.mock("../../src/models/index.cjs", () => ({
	default: {
		Brands: {},
		Categories: {},
		Inventories: {
			findOne: vi.fn(),
		},
		InventoryMovements: {
			create: vi.fn(),
		},
		ProductItems: {
			findByPk: vi.fn(),
		},
		Products: {},
		sequelize: {
			transaction: vi.fn(),
		},
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

const productItemId = "b5cbf379-0cfb-43d4-a2f3-3ddf76b4d7a3";
const userId = "7bf0806e-daca-4afa-a2e1-643babe31176";

const createInventory = (stock) => ({
	stock,
	update: vi.fn().mockResolvedValue(undefined),
});

const transaction = {
	LOCK: {
		UPDATE: "UPDATE",
	},
};

const transactionMock = /** @type {any} */ (db.sequelize.transaction);

describe("inventory controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		transactionMock.mockImplementation(async (callback) =>
			callback(transaction),
		);
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

	it("adds stock and records an inventory movement", async () => {
		const response = createResponse();
		const next = vi.fn();
		const inventory = createInventory(5);
		const createdAt = new Date("2026-09-15T03:30:00.000Z");

		db.ProductItems.findByPk.mockResolvedValue({ id: productItemId });
		db.Inventories.findOne.mockResolvedValue(inventory);
		db.InventoryMovements.create.mockResolvedValue({
			note: "Restock from supplier",
			createdAt,
		});

		await adjustStock(
			{
				params: { productItemId },
				body: {
					type: "addition",
					quantity: 10,
					note: "Restock from supplier",
				},
				user: { id: userId },
			},
			response,
			next,
		);

		expect(transactionMock).toHaveBeenCalledOnce();
		expect(inventory.update).toHaveBeenCalledWith(
			{ stock: 15 },
			{ transaction },
		);
		expect(db.InventoryMovements.create).toHaveBeenCalledWith(
			{
				productItemId,
				transactionId: null,
				userId,
				type: "addition",
				quantity: 10,
				stockBefore: 5,
				stockAfter: 15,
				note: "Restock from supplier",
			},
			{ transaction },
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(emitInventoryUpdated).toHaveBeenCalledWith(
			undefined,
			[productItemId],
			"manual_adjustment",
		);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Stock adjusted successfully",
			data: {
				product_item_id: productItemId,
				type: "addition",
				quantity: 10,
				stock_before: 5,
				stock_after: 15,
				note: "Restock from supplier",
				created_at: createdAt,
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("reduces stock without allowing a negative result", async () => {
		const response = createResponse();
		const next = vi.fn();
		const inventory = createInventory(5);

		db.ProductItems.findByPk.mockResolvedValue({ id: productItemId });
		db.Inventories.findOne.mockResolvedValue(inventory);

		await adjustStock(
			{
				params: { productItemId },
				body: {
					type: "reduction",
					quantity: 6,
					note: "Damaged item",
				},
				user: { id: userId },
			},
			response,
			next,
		);

		expect(inventory.update).not.toHaveBeenCalled();
		expect(db.InventoryMovements.create).not.toHaveBeenCalled();
		expect(emitInventoryUpdated).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Stock cannot be negative",
			}),
		);
	});

	it("sets the final stock for a correction adjustment", async () => {
		const response = createResponse();
		const next = vi.fn();
		const inventory = createInventory(12);

		db.ProductItems.findByPk.mockResolvedValue({ id: productItemId });
		db.Inventories.findOne.mockResolvedValue(inventory);
		db.InventoryMovements.create.mockResolvedValue({
			note: "Stock opname",
			createdAt: new Date("2026-09-15T03:30:00.000Z"),
		});

		await adjustStock(
			{
				params: { productItemId },
				body: {
					type: "correction",
					quantity: 8,
					note: "Stock opname",
				},
				user: { id: userId },
			},
			response,
			next,
		);

		expect(inventory.update).toHaveBeenCalledWith(
			{ stock: 8 },
			{ transaction },
		);
		expect(db.InventoryMovements.create).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "correction",
				quantity: 8,
				stockBefore: 12,
				stockAfter: 8,
			}),
			{ transaction },
		);
	});

	it.each([
		[
			{ type: "invalid", quantity: 1 },
			"type must be addition, reduction, or correction",
		],
		[{ type: "addition", quantity: 0 }, "quantity must be a positive integer"],
		[
			{ type: "addition", quantity: 1.5 },
			"quantity must be a positive integer",
		],
		[
			{ type: "addition", quantity: 1, note: 123 },
			"note must be a non-empty string",
		],
		[{ type: "addition", quantity: 1 }, "note must be a non-empty string"],
		[
			{ type: "addition", quantity: 1, note: "   " },
			"note must be a non-empty string",
		],
	])(
		"passes a 400 error for an invalid adjustment payload",
		async (body, message) => {
			const response = createResponse();
			const next = vi.fn();

			await adjustStock(
				{
					params: { productItemId },
					body,
					user: { id: userId },
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
			expect(db.sequelize.transaction).not.toHaveBeenCalled();
		},
	);

	it("passes a 404 error when the product item does not exist", async () => {
		const response = createResponse();
		const next = vi.fn();

		db.ProductItems.findByPk.mockResolvedValue(null);

		await adjustStock(
			{
				params: { productItemId },
				body: { type: "addition", quantity: 1, note: "Restock" },
				user: { id: userId },
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_NOT_FOUND,
				message: "Product item not found",
			}),
		);
		expect(db.Inventories.findOne).not.toHaveBeenCalled();
	});

	it("rejects source supplied by a manual adjustment request", async () => {
		const response = createResponse();
		const next = vi.fn();

		await adjustStock(
			{
				params: { productItemId },
				body: {
					type: "addition",
					quantity: 1,
					note: "Restock",
					source: "checkout",
				},
				user: { id: userId },
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "source must not be provided",
			}),
		);
		expect(db.sequelize.transaction).not.toHaveBeenCalled();
	});
});
