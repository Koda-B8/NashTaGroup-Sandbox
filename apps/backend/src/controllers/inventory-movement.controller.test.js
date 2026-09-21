import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { getInventoryMovements } from "./inventory-movement.controller.js";

vi.mock("../lib/pagination.js", () => ({ paginate: vi.fn() }));
vi.mock("../models/index.cjs", () => ({
	default: {
		InventoryMovements: {},
		ProductItems: {},
		Products: {},
		Transactions: {},
		Users: {},
	},
}));

const productItemId = "b5cbf379-0cfb-43d4-a2f3-3ddf76b4d7a3";
const movementId = "d96a9f52-b82f-411e-8ee4-1571318d15a3";

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

/**
 * @param {string | null} [transactionId]
 */
const createMovement = (transactionId = null) => ({
	id: movementId,
	productItemId,
	transactionId,
	type: transactionId ? "reduction" : "addition",
	quantity: 10,
	stockBefore: 5,
	stockAfter: transactionId ? 0 : 15,
	note: transactionId ? null : "Barang masuk dari supplier",
	createdAt: new Date("2026-09-15T03:30:00.000Z"),
	productItem: {
		id: productItemId,
		productCode: "SAM-A55-128-NVY",
		name: "8GB/128GB - Awesome Navy",
		product: { name: "Galaxy A55" },
	},
	user: { id: "7bf0806e-daca-4afa-a2e1-643babe31176", fullname: "Admin One" },
	transaction: transactionId
		? { id: transactionId, transactionNumber: "TRX-20260915-AB12CD34" }
		: null,
});

const pagination = { page: 1, limit: 20, total_items: 1, total_pages: 1 };

describe("inventory movement controller", () => {
	beforeEach(() => vi.clearAllMocks());

	it("lists movements with default pagination and maps sources", async () => {
		const response = createResponse();
		const next = vi.fn();
		const transactionId = "bc15e763-3f1d-47ec-842c-7563e5e7fe54";
		vi.mocked(paginate).mockResolvedValue({
			rows: [createMovement(), createMovement(transactionId)],
			pagination,
		});

		await getInventoryMovements({ query: {} }, response, next);

		expect(paginate).toHaveBeenCalledWith(
			db.InventoryMovements,
			{},
			expect.objectContaining({
				order: [["createdAt", "DESC"]],
				distinct: true,
			}),
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json.mock.calls[0][0]).toMatchObject({
			success: true,
			meta: { pagination },
			data: [
				{
					id: movementId,
					source: "manual_adjustment",
					transaction: null,
					performed_by: { fullname: "Admin One" },
				},
				{
					source: "checkout",
					transaction: {
						id: transactionId,
						transaction_number: "TRX-20260915-AB12CD34",
					},
				},
			],
		});
	});

	it.each([
		["type", "reduction", { type: "reduction" }],
		["product_item_id", productItemId, { productItemId }],
	])("filters by %s", async (field, value, expectedWhere) => {
		vi.mocked(paginate).mockResolvedValue({ rows: [], pagination });

		await getInventoryMovements(
			{ query: { [field]: value } },
			createResponse(),
			vi.fn(),
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.where).toMatchObject(expectedWhere);
	});

	it("passes requested pagination to the shared helper", async () => {
		vi.mocked(paginate).mockResolvedValue({
			rows: [],
			pagination: { page: 2, limit: 10, total_items: 11, total_pages: 2 },
		});

		await getInventoryMovements(
			{ query: { page: "2", limit: "10" } },
			createResponse(),
			vi.fn(),
		);

		expect(paginate).toHaveBeenCalledWith(
			db.InventoryMovements,
			{ page: "2", limit: "10" },
			expect.any(Object),
		);
	});

	it("searches product code, product name, and variant name", async () => {
		vi.mocked(paginate).mockResolvedValue({ rows: [], pagination });

		await getInventoryMovements(
			{ query: { q: "Galaxy" } },
			createResponse(),
			vi.fn(),
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.where?.[Op.or]).toEqual([
			{ "$productItem.productCode$": { [Op.iLike]: "%Galaxy%" } },
			{ "$productItem.name$": { [Op.iLike]: "%Galaxy%" } },
			{ "$productItem.product.name$": { [Op.iLike]: "%Galaxy%" } },
		]);
	});

	it("filters an inclusive date range", async () => {
		vi.mocked(paginate).mockResolvedValue({ rows: [], pagination });

		await getInventoryMovements(
			{ query: { from: "2026-09-01", to: "2026-09-30" } },
			createResponse(),
			vi.fn(),
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];
		const createdAt = options?.where?.createdAt;

		expect(createdAt?.[Op.gte]).toEqual(new Date("2026-09-01T00:00:00.000Z"));
		expect(createdAt?.[Op.lt]).toEqual(new Date("2026-10-01T00:00:00.000Z"));
	});

	it.each([
		[{ type: "transfer" }, "type must be addition, reduction, or correction"],
		[{ product_item_id: "invalid" }, "product_item_id must be a valid UUID"],
		[{ from: "2026-02-30" }, "from must use YYYY-MM-DD format"],
		[
			{ from: "2026-09-02", to: "2026-09-01" },
			"from must not be greater than to",
		],
	])("rejects invalid query %#", async (query, message) => {
		const next = vi.fn();

		await getInventoryMovements({ query }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message,
			}),
		);
		expect(paginate).not.toHaveBeenCalled();
	});
});
