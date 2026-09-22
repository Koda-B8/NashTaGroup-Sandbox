import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	getTransactionById,
	getTransactions,
} from "../../src/controllers/transaction.controller.js";
import { paginate } from "../../src/lib/pagination.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/lib/pagination.js", () => ({
	paginate: vi.fn(),
}));

vi.mock("../../src/models/index.cjs", () => ({
	default: {
		Customers: {},
		PaymentMethods: {},
		Payments: {},
		TransactionDetails: {},
		Transactions: {
			findByPk: vi.fn(),
		},
		Users: {},
	},
}));

const transactionId = "641a3031-e0db-4497-a032-a2a2545b5ac9";
const customerId = "2f13fc74-ec91-4a88-959d-aed84de60132";
const cashierId = "86ec27f0-9559-47f2-8fea-5cfbc34ee25f";
const paymentMethodId = "dfda501e-21ba-4dda-af16-9f843fa29d59";

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

/**
 * @param {{
 *  customer?: { id: string; name: string; phone: string } | null;
 *  details?: Array<{
 *   productItemId: string;
 *   productName: string;
 *   productCode: string;
 *   unitPrice: string;
 *   qty: number;
 *   subtotal: string;
 *  }>;
 * }} [options]
 */
const createTransaction = ({
	customer = {
		id: customerId,
		name: "Budi",
		phone: "08123456789",
	},
	details = [],
} = {}) => ({
	toJSON: () => ({
		id: transactionId,
		transactionNumber: "TRX-20260907-0001",
		status: "completed",
		subtotal: "5999000.00",
		discountAmount: "0.00",
		taxAmount: "0.00",
		totalAmount: "5999000.00",
		createdAt: new Date("2026-09-07T09:45:00.000Z"),
		user: {
			id: cashierId,
			fullname: "Cashier One",
		},
		customer,
		details,
		payment: {
			paymentMethodId,
			paymentReference: null,
			status: "paid",
			amount: "5999000.00",
			paidAmount: "6000000.00",
			changeAmount: "1000.00",
			paidAt: new Date("2026-09-07T09:45:00.000Z"),
			paymentMethod: {
				id: paymentMethodId,
				name: "Cash",
			},
		},
	}),
});

describe("transaction controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns paginated transactions using the contract filters", async () => {
		const response = createResponse();
		const next = vi.fn();
		const transaction = createTransaction();

		vi.mocked(paginate).mockResolvedValue({
			rows: [transaction],
			pagination: {
				page: 1,
				limit: 20,
				total_items: 1,
				total_pages: 1,
			},
		});

		await getTransactions(
			{
				query: {
					page: "1",
					limit: "20",
					month: "2026-09",
					customer_id: customerId,
					cashier_id: cashierId,
					payment_method_id: paymentMethodId,
					status: "completed",
					member_type: "member",
					q: "20260907",
				},
			},
			response,
			next,
		);

		expect(paginate).toHaveBeenCalledWith(
			db.Transactions,
			expect.any(Object),
			expect.any(Object),
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.where).toEqual({
			createdAt: {
				[Op.gte]: new Date("2026-09-01T00:00:00.000Z"),
				[Op.lt]: new Date("2026-10-01T00:00:00.000Z"),
			},
			customerId,
			userId: cashierId,
			status: "completed",
			transactionNumber: {
				[Op.iLike]: "%20260907%",
			},
		});

		expect(options?.include[2]).toEqual(
			expect.objectContaining({
				as: "payment",
				required: true,
				where: { paymentMethodId },
			}),
		);

		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Transactions retrieved successfully",
			data: [
				{
					id: transactionId,
					transaction_number: "TRX-20260907-0001",
					status: "completed",
					cashier: {
						id: cashierId,
						fullname: "Cashier One",
					},
					customer: {
						id: customerId,
						name: "Budi",
						phone: "08123456789",
					},
					total_amount: "5999000.00",
					payment: {
						method: "Cash",
						status: "paid",
					},
					created_at: new Date("2026-09-07T09:45:00.000Z"),
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

	it("filters member transactions when member_type is member", async () => {
		const response = createResponse();
		const next = vi.fn();

		vi.mocked(paginate).mockResolvedValue({
			rows: [],
			pagination: {
				page: 1,
				limit: 20,
				total_items: 0,
				total_pages: 0,
			},
		});

		await getTransactions({ query: { member_type: "member" } }, response, next);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.where).toEqual({
			customerId: { [Op.not]: null },
		});
	});

	it("filters non-member transactions when member_type is non_member", async () => {
		const response = createResponse();
		const next = vi.fn();

		vi.mocked(paginate).mockResolvedValue({
			rows: [],
			pagination: {
				page: 1,
				limit: 20,
				total_items: 0,
				total_pages: 0,
			},
		});

		await getTransactions(
			{ query: { member_type: "non_member" } },
			response,
			next,
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.where).toEqual({ customerId: null });
	});

	it.each([
		[{ month: "2026/09" }, "month must use YYYY-MM format"],
		[{ customer_id: "invalid" }, "customer_id must be a valid UUID"],
		[{ cashier_id: "invalid" }, "cashier_id must be a valid UUID"],
		[
			{ payment_method_id: "invalid" },
			"payment_method_id must be a valid UUID",
		],
		[
			{ status: "processing" },
			"status must be pending, completed, cancelled, or refunded",
		],
		[{ member_type: "all" }, "member_type must be member or non_member"],
		[
			{ customer_id: customerId, member_type: "non_member" },
			"customer_id cannot be used with member_type=non_member",
		],
	])("passes a 400 error for invalid list query %#", async (query, message) => {
		const response = createResponse();
		const next = vi.fn();

		await getTransactions({ query }, response, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message,
			}),
		);
		expect(paginate).not.toHaveBeenCalled();
	});

	it("returns a complete transaction detail using checkout response structure", async () => {
		const response = createResponse();
		const next = vi.fn();

		vi.mocked(db.Transactions.findByPk).mockResolvedValue(
			createTransaction({
				details: [
					{
						productItemId: "d7878d58-7742-4389-9c35-92d72351f200",
						productName: "Samsung Galaxy A55 8GB/128GB - Awesome Navy",
						productCode: "SAM-A55-128-NVY",
						unitPrice: "5999000.00",
						qty: 1,
						subtotal: "5999000.00",
					},
				],
			}),
		);

		await getTransactionById({ params: { id: transactionId } }, response, next);

		expect(db.Transactions.findByPk).toHaveBeenCalledWith(
			transactionId,
			expect.objectContaining({
				include: expect.any(Array),
				order: expect.any(Array),
			}),
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Transaction retrieved successfully",
			data: {
				id: transactionId,
				transaction_number: "TRX-20260907-0001",
				status: "completed",
				cashier: {
					id: cashierId,
					fullname: "Cashier One",
				},
				customer: {
					id: customerId,
					name: "Budi",
					phone: "08123456789",
				},
				items: [
					{
						product_item_id: "d7878d58-7742-4389-9c35-92d72351f200",
						product_name: "Samsung Galaxy A55 8GB/128GB - Awesome Navy",
						product_code: "SAM-A55-128-NVY",
						unit_price: "5999000.00",
						qty: 1,
						subtotal: "5999000.00",
					},
				],
				summary: {
					subtotal: "5999000.00",
					discount_amount: "0.00",
					tax_amount: "0.00",
					total_amount: "5999000.00",
				},
				payment: {
					method: "Cash",
					payment_reference: null,
					amount: "5999000.00",
					paid_amount: "6000000.00",
					change_amount: "1000.00",
					status: "paid",
					paid_at: new Date("2026-09-07T09:45:00.000Z"),
				},
				created_at: new Date("2026-09-07T09:45:00.000Z"),
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 404 when the transaction does not exist", async () => {
		const response = createResponse();
		const next = vi.fn();

		vi.mocked(db.Transactions.findByPk).mockResolvedValue(null);

		await getTransactionById({ params: { id: transactionId } }, response, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_NOT_FOUND,
				message: "Transaction not found",
			}),
		);
	});

	it("passes a 400 error for an invalid transaction ID", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getTransactionById({ params: { id: "invalid" } }, response, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "id must be a valid UUID",
			}),
		);
		expect(db.Transactions.findByPk).not.toHaveBeenCalled();
	});

	it("passes unexpected list errors to the error middleware", async () => {
		const response = createResponse();
		const next = vi.fn();
		const error = new Error("database unavailable");

		vi.mocked(paginate).mockRejectedValue(error);

		await getTransactions({ query: {} }, response, next);

		expect(next).toHaveBeenCalledWith(error);
	});
});
