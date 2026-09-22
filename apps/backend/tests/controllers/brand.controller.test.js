import { constants } from "node:http2";

import { UniqueConstraintError } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createBrand,
	deleteBrand,
	updateBrand,
} from "../../src/controllers/brand.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: {
		Brands: { create: vi.fn(), findByPk: vi.fn() },
		Products: { count: vi.fn() },
	},
}));

const brandId = "11111111-1111-4111-8111-111111111111";
const brand = { id: brandId, name: "Samsung", isActive: true };
const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("brand controller", () => {
	beforeEach(() => vi.clearAllMocks());

	it("creates a brand with a normalized name", async () => {
		const response = createResponse();
		const next = vi.fn();
		db.Brands.create.mockResolvedValue(brand);

		await createBrand({ body: { name: "  Sam   sung " } }, response, next);

		expect(db.Brands.create).toHaveBeenCalledWith({ name: "Sam sung" });
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Brand created successfully",
			data: brand,
		});
	});

	it.each([
		[{}, "Brand name is required"],
		[{ name: " " }, "Brand name is required"],
		[{ name: "a".repeat(101) }, "Brand name must not exceed 100 characters"],
	])("rejects invalid create payload", async (body, message) => {
		const next = vi.fn();

		await createBrand({ body }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message,
			}),
		);
	});

	it("returns 409 for a duplicate brand", async () => {
		const next = vi.fn();
		db.Brands.create.mockRejectedValue(
			new UniqueConstraintError({ message: "duplicate key", errors: [] }),
		);

		await createBrand({ body: { name: "Samsung" } }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Brand name already exists",
			}),
		);
	});

	it("updates a brand name and active status", async () => {
		const response = createResponse();
		const next = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		const brandToUpdate = { ...brand, update };
		db.Brands.findByPk.mockResolvedValue(brandToUpdate);

		await updateBrand(
			{
				params: { id: brandId },
				body: { name: "  Samsung Indonesia ", is_active: false },
			},
			response,
			next,
		);

		expect(update).toHaveBeenCalledWith({
			name: "Samsung Indonesia",
			isActive: false,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Brand updated successfully",
			data: brandToUpdate,
		});
	});

	it("rejects an invalid brand id before looking it up for update", async () => {
		const next = vi.fn();

		await updateBrand(
			{ params: { id: "invalid" }, body: { name: "Samsung" } },
			createResponse(),
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Brand id must be a valid UUID",
			}),
		);
		expect(db.Brands.findByPk).not.toHaveBeenCalled();
	});

	it("returns 404 when the brand to update does not exist", async () => {
		const next = vi.fn();
		db.Brands.findByPk.mockResolvedValue(null);

		await updateBrand(
			{ params: { id: brandId }, body: { name: "Samsung" } },
			createResponse(),
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_NOT_FOUND,
				message: "Brand not found",
			}),
		);
	});

	it("returns 409 when updating to a duplicate brand name", async () => {
		const next = vi.fn();
		const update = vi
			.fn()
			.mockRejectedValue(
				new UniqueConstraintError({ message: "duplicate key", errors: [] }),
			);
		db.Brands.findByPk.mockResolvedValue({ ...brand, update });

		await updateBrand(
			{ params: { id: brandId }, body: { name: "Samsung" } },
			createResponse(),
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Brand name already exists",
			}),
		);
	});

	it.each([
		[{}, "No valid field provided for update"],
		[{ is_active: "false" }, "is_active must be a boolean"],
		[{ unknown: true }, "Only name and is_active can be updated"],
	])("rejects invalid update payload", async (body, message) => {
		const next = vi.fn();

		await updateBrand(
			{ params: { id: brandId }, body },
			createResponse(),
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message,
			}),
		);
		expect(db.Brands.findByPk).not.toHaveBeenCalled();
	});

	it("soft deletes a brand that is not used by products", async () => {
		const response = createResponse();
		const next = vi.fn();
		const destroy = vi.fn().mockResolvedValue(undefined);
		db.Brands.findByPk.mockResolvedValue({ ...brand, destroy });
		db.Products.count.mockResolvedValue(0);

		await deleteBrand({ params: { id: brandId } }, response, next);

		expect(db.Products.count).toHaveBeenCalledWith({ where: { brandId } });
		expect(destroy).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Brand deleted successfully",
		});
	});

	it("rejects an invalid brand id before looking it up for deletion", async () => {
		const next = vi.fn();

		await deleteBrand({ params: { id: "invalid" } }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Brand id must be a valid UUID",
			}),
		);
		expect(db.Brands.findByPk).not.toHaveBeenCalled();
	});

	it("returns 404 without checking products when the brand to delete is absent", async () => {
		const next = vi.fn();
		db.Brands.findByPk.mockResolvedValue(null);

		await deleteBrand({ params: { id: brandId } }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_NOT_FOUND,
				message: "Brand not found",
			}),
		);
		expect(db.Products.count).not.toHaveBeenCalled();
	});

	it("rejects deleting a brand used by products", async () => {
		const next = vi.fn();
		const destroy = vi.fn();
		db.Brands.findByPk.mockResolvedValue({ ...brand, destroy });
		db.Products.count.mockResolvedValue(1);

		await deleteBrand({ params: { id: brandId } }, createResponse(), next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Brand cannot be deleted because it is used by products",
			}),
		);
		expect(destroy).not.toHaveBeenCalled();
	});
});
