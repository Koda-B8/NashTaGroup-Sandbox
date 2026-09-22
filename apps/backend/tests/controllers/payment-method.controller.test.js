import { constants } from "node:http2";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPaymentMethods } from "../../src/controllers/payment-method.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: {
		PaymentMethods: {
			findAll: vi.fn(),
		},
	},
}));

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("payment method controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("retrieves active payment methods", async () => {
		db.PaymentMethods.findAll.mockResolvedValue([
			{
				id: "11111111-1111-4111-8111-111111111111",
				code: "CASH",
				name: "Cash",
				type: "cash",
				adminFee: "0.00",
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
		const response = createResponse();
		const next = vi.fn();

		await getPaymentMethods({ query: { is_active: "true" } }, response, next);

		expect(db.PaymentMethods.findAll).toHaveBeenCalledWith({
			where: { isActive: true },
			order: [["name", "ASC"]],
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Payment methods retrieved successfully",
			data: [
				{
					id: "11111111-1111-4111-8111-111111111111",
					code: "CASH",
					name: "Cash",
					type: "cash",
					admin_fee: "0.00",
					is_active: true,
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				},
			],
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects an invalid active-status filter", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getPaymentMethods({ query: { is_active: "yes" } }, response, next);

		expect(db.PaymentMethods.findAll).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "is_active must be true or false",
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
			}),
		);
	});
});
