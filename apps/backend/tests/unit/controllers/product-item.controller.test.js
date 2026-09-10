import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createProductItem,
	deleteProductItem,
	getProductItems,
} from "../../../controllers/product-item.controller.js";
import db from "../../../models/index.cjs";

vi.mock("../../../models/index.cjs", () => ({
	default: {
		ProductItems: {
			create: vi.fn(),
			findAll: vi.fn(),
			findByPk: vi.fn(),
		},
		Products: {
			findByPk: vi.fn(),
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
	product,
};

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("product item controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		db.Products.findByPk.mockResolvedValue(product);
	});

	it("retrieves product items with search and filters", async () => {
		db.ProductItems.findAll.mockResolvedValue([productItem]);

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

		expect(options.where.productId).toBe(productId);
		expect(options.where.isActive).toBe(true);
		expect(options.where[Op.or][0].name[Op.iLike]).toBe("%A55%");
		expect(options.where[Op.or][1].productCode[Op.iLike]).toBe("%A55%");
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product items retrieved successfully",
			data: [productItem],
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
				},
			},
			response,
			next,
		);

		expect(db.Products.findByPk).toHaveBeenCalledWith(productId);
		expect(db.ProductItems.create).toHaveBeenCalledWith({
			productId,
			productCode: "SAM-A55-256-BLU",
			name: "Samsung Galaxy A55 256GB Blue",
			price: "6499000.00",
			isActive: true,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product item created successfully",
			data: productItem,
		});
		expect(next).not.toHaveBeenCalled();
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
