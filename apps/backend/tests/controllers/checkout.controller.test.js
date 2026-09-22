import { constants } from "node:http2";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkout } from "../../src/controllers/checkout.controller.js";
import { emitInventoryUpdated } from "../../src/lib/inventory-realtime.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/lib/inventory-realtime.js", () => ({
	emitInventoryUpdated: vi.fn(),
}));

vi.mock("../../src/models/index.cjs", () => ({
	default: {
		Customers: {
			create: vi.fn(),
			findByPk: vi.fn(),
			findOne: vi.fn(),
		},
		Inventories: {
			findOne: vi.fn(),
		},
		InventoryMovements: {
			create: vi.fn(),
		},
		PaymentMethods: {
			findOne: vi.fn(),
		},
		Payments: {
			create: vi.fn(),
		},
		ProductItems: {
			findOne: vi.fn(),
		},
		Products: {
			findOne: vi.fn(),
		},
		TransactionDetails: {
			bulkCreate: vi.fn(),
		},
		Transactions: {
			create: vi.fn(),
			findByPk: vi.fn(),
			findOne: vi.fn(),
		},
		Users: {},
		sequelize: {
			transaction: vi.fn(),
		},
	},
}));

const userId = "7bf0806e-daca-4afa-a2e1-643babe31176";
const productItemId = "b5cbf379-0cfb-43d4-a2f3-3ddf76b4d7a3";
const productId = "8d2ce5f1-1ab3-4e5f-862c-bcfaa4e3122e";
const paymentMethodId = "dfda501e-21ba-4dda-af16-9f843fa29d59";
const transactionId = "641a3031-e0db-4497-a032-a2a2545b5ac9";
const customerId = "2f13fc74-ec91-4a88-959d-aed84de60132";

const databaseTransaction = {
	LOCK: {
		UPDATE: "UPDATE",
	},
};

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

const createRequest = (body, idempotencyKey) => ({
	body,
	get: vi.fn((header) =>
		header === "Idempotency-Key" ? idempotencyKey : undefined,
	),
	user: {
		id: userId,
		fullname: "Cashier One",
		role: "cashier",
	},
});

const createCheckoutRecord = (overrides = {}) => ({
	id: transactionId,
	userId,
	customerId: null,
	transactionNumber: "TRX-20260915-ABC12345",
	status: "completed",
	subtotal: "5999000.00",
	discountAmount: "0.00",
	taxAmount: "0.00",
	totalAmount: "5999000.00",
	createdAt: new Date("2026-09-15T07:00:00.000Z"),
	user: {
		id: userId,
		fullname: "Cashier One",
	},
	customer: null,
	details: [
		{
			productItemId,
			productName: "Samsung Galaxy A55 8GB/128GB - Awesome Navy",
			productCode: "SAM-A55-128-NVY",
			unitPrice: "5999000.00",
			qty: 1,
			subtotal: "5999000.00",
		},
	],
	payment: {
		paymentMethodId,
		paymentReference: null,
		status: "paid",
		amount: "5999000.00",
		paidAmount: "6000000.00",
		changeAmount: "1000.00",
		paidAt: new Date("2026-09-15T07:00:00.000Z"),
		paymentMethod: {
			name: "Cash",
		},
	},
	...overrides,
});

const validBody = {
	payment_method_id: paymentMethodId,
	paid_amount: "6000000.00",
	items: [
		{
			product_item_id: productItemId,
			qty: 1,
		},
	],
};

describe("checkout controller", () => {
	let inventory;
	let transactionRecord;

	beforeEach(() => {
		vi.clearAllMocks();

		inventory = {
			stock: 5,
			update: vi.fn().mockResolvedValue(undefined),
		};
		transactionRecord = {
			id: transactionId,
			update: vi.fn().mockResolvedValue(undefined),
		};

		const transactionMock = /** @type {any} */ (db.sequelize.transaction);

		transactionMock.mockImplementation(async (callback) =>
			callback(databaseTransaction),
		);
		vi.mocked(db.Transactions.findOne).mockResolvedValue(null);
		vi.mocked(db.Transactions.create).mockResolvedValue(transactionRecord);
		vi.mocked(db.Transactions.findByPk).mockResolvedValue(
			createCheckoutRecord(),
		);
		vi.mocked(db.Customers.findOne).mockResolvedValue(null);
		vi.mocked(db.PaymentMethods.findOne).mockResolvedValue({
			id: paymentMethodId,
			type: "cash",
		});
		vi.mocked(db.ProductItems.findOne).mockResolvedValue({
			id: productItemId,
			productId,
			productCode: "SAM-A55-128-NVY",
			name: "8GB/128GB - Awesome Navy",
			price: "5999000.00",
		});
		vi.mocked(db.Products.findOne).mockResolvedValue({
			id: productId,
			name: "Samsung Galaxy A55",
		});
		vi.mocked(db.Inventories.findOne).mockResolvedValue(inventory);
		vi.mocked(db.TransactionDetails.bulkCreate).mockResolvedValue();
		vi.mocked(db.InventoryMovements.create).mockResolvedValue();
		vi.mocked(db.Payments.create).mockResolvedValue();
	});

	it("completes a non-member cash checkout atomically", async () => {
		const request = createRequest(
			validBody,
			"1faa2779-19de-4395-8fa7-a86259c14d17",
		);
		const response = createResponse();
		const next = vi.fn();

		await checkout(request, response, next);

		expect(db.sequelize.transaction).toHaveBeenCalledOnce();
		expect(db.Transactions.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId,
				customerId: null,
				idempotencyKey: "1faa2779-19de-4395-8fa7-a86259c14d17",
				status: "pending",
				subtotal: "0.00",
			}),
			{ transaction: databaseTransaction },
		);
		expect(transactionRecord.update).toHaveBeenCalledWith(
			{
				customerId: null,
				status: "completed",
				subtotal: "5999000.00",
				discountAmount: "0.00",
				taxAmount: "0.00",
				totalAmount: "5999000.00",
			},
			{ transaction: databaseTransaction },
		);
		expect(inventory.update).toHaveBeenCalledWith(
			{ stock: 4 },
			{ transaction: databaseTransaction },
		);
		expect(db.InventoryMovements.create).toHaveBeenCalledWith(
			{
				productItemId,
				transactionId,
				userId,
				type: "reduction",
				quantity: 1,
				stockBefore: 5,
				stockAfter: 4,
				note: null,
			},
			{ transaction: databaseTransaction },
		);
		expect(db.Payments.create).toHaveBeenCalledWith(
			expect.objectContaining({
				transactionId,
				paymentMethodId,
				status: "paid",
				amount: "5999000.00",
				paidAmount: "6000000.00",
				changeAmount: "1000.00",
			}),
			{ transaction: databaseTransaction },
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(emitInventoryUpdated).toHaveBeenCalledWith(
			undefined,
			[productItemId],
			"checkout",
		);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				message: "Transaction completed successfully",
				data: expect.objectContaining({
					id: transactionId,
					status: "completed",
					customer: null,
				}),
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("returns the existing transaction for the same idempotency key and payload", async () => {
		const existingTransaction = createCheckoutRecord();

		vi.mocked(db.Transactions.findOne).mockResolvedValue(existingTransaction);
		vi.mocked(db.Transactions.findByPk).mockResolvedValue(existingTransaction);

		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(validBody, "1faa2779-19de-4395-8fa7-a86259c14d17"),
			response,
			next,
		);

		expect(db.Transactions.create).not.toHaveBeenCalled();
		expect(inventory.update).not.toHaveBeenCalled();
		expect(emitInventoryUpdated).not.toHaveBeenCalled();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				data: expect.objectContaining({ id: transactionId }),
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 409 when the idempotency key is reused with a different payload", async () => {
		vi.mocked(db.Transactions.findOne).mockResolvedValue(
			createCheckoutRecord(),
		);

		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(
				{
					...validBody,
					paid_amount: "7000000.00",
				},
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message:
					"Idempotency-Key has already been used with a different payload",
			}),
		);
		expect(db.Transactions.create).not.toHaveBeenCalled();
	});

	it("returns 409 with stock details when stock is insufficient", async () => {
		vi.mocked(db.Inventories.findOne).mockResolvedValue({
			stock: 0,
			update: vi.fn(),
		});

		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(validBody, "1faa2779-19de-4395-8fa7-a86259c14d17"),
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Insufficient stock",
				errors: [
					{
						product_item_id: productItemId,
						product_code: "SAM-A55-128-NVY",
						available_stock: 0,
						requested_qty: 1,
					},
				],
			}),
		);
		expect(inventory.update).not.toHaveBeenCalled();
		expect(db.InventoryMovements.create).not.toHaveBeenCalled();
		expect(db.Payments.create).not.toHaveBeenCalled();
		expect(emitInventoryUpdated).not.toHaveBeenCalled();
	});

	it("completes an existing-member checkout using a normalized phone", async () => {
		vi.mocked(db.Customers.findOne).mockResolvedValue({
			id: customerId,
			phone: "08123456789",
		});

		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(
				{ ...validBody, customer_phone: " 0812-345-6789 " },
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			response,
			next,
		);

		expect(db.Customers.findOne).toHaveBeenCalledWith({
			where: { phone: "08123456789" },
			transaction: databaseTransaction,
			lock: databaseTransaction.LOCK.UPDATE,
		});
		expect(transactionRecord.update).toHaveBeenCalledWith(
			expect.objectContaining({ customerId }),
			{ transaction: databaseTransaction },
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("keeps new-member checkout behavior", async () => {
		vi.mocked(db.Customers.create).mockResolvedValue({
			id: customerId,
			phone: "08123456789",
		});

		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(
				{
					...validBody,
					customer: { name: "Budi", phone: "08123456789" },
				},
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			response,
			next,
		);

		expect(db.Customers.create).toHaveBeenCalledWith(
			{ name: "Budi", phone: "08123456789" },
			{ transaction: databaseTransaction },
		);
		expect(transactionRecord.update).toHaveBeenCalledWith(
			expect.objectContaining({ customerId }),
			{ transaction: databaseTransaction },
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 404 for an unregistered existing-member phone", async () => {
		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(
				{ ...validBody, customer_phone: "08123456789" },
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_NOT_FOUND,
				message: "Customer not found",
			}),
		);
	});

	it("replays an existing-member checkout only for the same normalized phone", async () => {
		const existingTransaction = createCheckoutRecord({
			customerId,
			customer: { id: customerId, name: "Budi", phone: "08123456789" },
		});
		vi.mocked(db.Transactions.findOne).mockResolvedValue(existingTransaction);
		vi.mocked(db.Transactions.findByPk).mockResolvedValue(existingTransaction);

		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(
				{ ...validBody, customer_phone: "0812-345-6789" },
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			response,
			next,
		);

		expect(db.Transactions.create).not.toHaveBeenCalled();
		expect(inventory.update).not.toHaveBeenCalled();
		expect(db.InventoryMovements.create).not.toHaveBeenCalled();
		expect(db.Payments.create).not.toHaveBeenCalled();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);

		await checkout(
			createRequest(
				{ ...validBody, customer_phone: "08123456780" },
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			createResponse(),
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message:
					"Idempotency-Key has already been used with a different payload",
			}),
		);
	});

	it.each([
		[
			{ ...validBody, customer_phone: "invalid" },
			"customer_phone must be a valid phone number",
		],
		[
			{
				...validBody,
				customer_phone: "08123456789",
				customer: { name: "Budi", phone: "08123456789" },
			},
			"customer_phone and customer cannot be provided together",
		],
		[
			{ ...validBody, customer_id: customerId },
			"customer_id is no longer supported; use customer_phone",
		],
	])("rejects invalid member selection: %s", async (body, message) => {
		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(body, "1faa2779-19de-4395-8fa7-a86259c14d17"),
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
	});

	it("rejects cash payment below the calculated total", async () => {
		const response = createResponse();
		const next = vi.fn();

		await checkout(
			createRequest(
				{
					...validBody,
					paid_amount: "5000000.00",
				},
				"1faa2779-19de-4395-8fa7-a86259c14d17",
			),
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message:
					"paid_amount must be greater than or equal to total_amount for cash payment",
			}),
		);
		expect(inventory.update).not.toHaveBeenCalled();
		expect(db.Payments.create).not.toHaveBeenCalled();
	});
});
