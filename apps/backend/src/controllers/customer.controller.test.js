import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { getCustomers } from "./customer.controller.js";

vi.mock("../lib/pagination.js", async (importOriginal) => ({
	...(await importOriginal()),
	paginate: vi.fn(),
}));
vi.mock("../models/index.cjs", () => ({ default: { Customers: {} } }));

const customer = {
	id: "7bf0806e-daca-4afa-a2e1-643babe31176",
	name: "Nash Ta",
	phone: "08123456789",
	createdAt: "2026-09-21T09:30:00.000Z",
};
const pagination = { page: 1, limit: 20, total_items: 1, total_pages: 1 };

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("getCustomers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(paginate).mockResolvedValue({ rows: [customer], pagination });
	});

	it("uses default pagination and returns only customer list fields", async () => {
		const response = createResponse();

		await getCustomers({ query: {} }, response, vi.fn());

		expect(paginate).toHaveBeenCalledWith(
			db.Customers,
			{},
			{
				where: {},
				attributes: ["id", "name", "phone", "createdAt"],
				order: [["createdAt", "DESC"]],
			},
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Customers retrieved successfully",
			data: [
				{
					id: customer.id,
					name: customer.name,
					phone: customer.phone,
					created_at: customer.createdAt,
				},
			],
			meta: { pagination },
		});
	});

	it("searches name and phone case-insensitively", async () => {
		await getCustomers({ query: { q: " Nash " } }, createResponse(), vi.fn());

		expect(paginate).toHaveBeenCalledWith(
			db.Customers,
			{ q: " Nash " },
			expect.objectContaining({
				where: {
					[Op.or]: [
						{ name: { [Op.iLike]: "%Nash%" } },
						{ phone: { [Op.iLike]: "%Nash%" } },
					],
				},
			}),
		);
	});

	it("forwards requested pagination to the shared helper", async () => {
		await getCustomers(
			{ query: { page: "3", limit: "5" } },
			createResponse(),
			vi.fn(),
		);

		expect(paginate).toHaveBeenCalledWith(
			db.Customers,
			{ page: "3", limit: "5" },
			expect.any(Object),
		);
	});

	it("forwards invalid pagination without calling paginate", async () => {
		const next = vi.fn();

		await getCustomers({ query: { limit: "0" } }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "limit must be between 1 and 100" }),
		);
		expect(paginate).not.toHaveBeenCalled();
	});
});
