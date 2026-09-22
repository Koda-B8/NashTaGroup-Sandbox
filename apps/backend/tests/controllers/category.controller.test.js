import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategoryById,
	updateCategory,
} from "../../src/controllers/category.controller.js";
import db from "../../src/models/index.cjs";

vi.mock("../../src/models/index.cjs", () => ({
	default: {
		Categories: {
			create: vi.fn(),
			findAll: vi.fn(),
			findByPk: vi.fn(),
		},
		CategoryAttributeOptions: {
			bulkCreate: vi.fn(),
			create: vi.fn(),
			destroy: vi.fn(),
			findAll: vi.fn(),
		},
		CategoryAttributes: {
			bulkCreate: vi.fn(),
			create: vi.fn(),
			destroy: vi.fn(),
			findAll: vi.fn(),
		},
		ProductItemAttributeValues: { count: vi.fn() },
		sequelize: {
			transaction: vi.fn((callback) =>
				callback({ id: "database-transaction" }),
			),
		},
	},
}));

const categoryId = "11111111-1111-4111-8111-111111111111";

const category = {
	id: categoryId,
	name: "Smartphone",
	isActive: true,
};

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("category controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("retrieves categories with search and active-status filter", async () => {
		const response = createResponse();
		const next = vi.fn();

		db.Categories.findAll.mockResolvedValue([category]);

		await getCategories(
			{
				query: {
					search: "phone",
					isActive: "true",
				},
			},
			response,
			next,
		);

		expect(db.Categories.findAll).toHaveBeenCalledWith({
			where: {
				name: {
					[Op.iLike]: "%phone%",
				},
				isActive: true,
			},
			include: [expect.objectContaining({ as: "attributes" })],
			order: [["name", "ASC"]],
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Categories retrieved successfully",
			data: [category],
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid isActive filter", async () => {
		const response = createResponse();
		const next = vi.fn();

		await getCategories(
			{
				query: {
					isActive: "yes",
				},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "isActive must be true or false",
			}),
		);
		expect(db.Categories.findAll).not.toHaveBeenCalled();
	});

	it("retrieves one category by ID", async () => {
		const response = createResponse();
		const next = vi.fn();

		db.Categories.findByPk.mockResolvedValue(category);

		await getCategoryById({ params: { id: categoryId } }, response, next);

		expect(db.Categories.findByPk).toHaveBeenCalledWith(categoryId, {
			include: [expect.objectContaining({ as: "attributes" })],
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Category retrieved successfully",
			data: category,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 404 when the category does not exist", async () => {
		const response = createResponse();
		const next = vi.fn();

		db.Categories.findByPk.mockResolvedValue(null);

		await getCategoryById({ params: { id: categoryId } }, response, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_NOT_FOUND,
				message: "Category not found",
			}),
		);
	});

	it("creates a category with a normalized name", async () => {
		const response = createResponse();
		const next = vi.fn();
		const createdCategory = {
			...category,
			name: "Gaming Accessories",
		};

		db.Categories.create.mockResolvedValue(createdCategory);

		await createCategory(
			{
				body: {
					name: "  Gaming   Accessories  ",
				},
			},
			response,
			next,
		);

		expect(db.Categories.create).toHaveBeenCalledWith({
			name: "Gaming Accessories",
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Category created successfully",
			data: createdCategory,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 400 when the category name is missing", async () => {
		const response = createResponse();
		const next = vi.fn();

		await createCategory(
			{
				body: {
					name: "   ",
				},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Category name is required",
			}),
		);
		expect(db.Categories.create).not.toHaveBeenCalled();
	});

	it("creates category attribute definitions in the same transaction", async () => {
		const colorId = "55555555-5555-4555-8555-555555555555";
		db.CategoryAttributes.bulkCreate.mockResolvedValue([{ id: colorId }]);
		db.Categories.create.mockResolvedValue({ ...category, id: categoryId });
		db.Categories.findByPk.mockResolvedValue({
			...category,
			attributes: [
				{
					id: colorId,
					name: "Color",
					value: "Blue",
					isRequired: true,
					isVariant: true,
					sortOrder: 0,
					options: [
						{
							id: "66666666-6666-4666-8666-666666666666",
							name: "Blue",
							hex: "#3B82F6",
							sortOrder: 0,
						},
					],
				},
			],
		});
		const response = createResponse();
		const next = vi.fn();

		await createCategory(
			{
				body: {
					name: "Smartphone",
					attributes: [
						{
							name: " Color ",
							value: " Blue ",
							isRequired: true,
							isVariant: true,
							options: [{ name: "Blue", hex: "#3b82f6" }],
						},
					],
				},
			},
			response,
			next,
		);

		expect(db.CategoryAttributes.bulkCreate).toHaveBeenCalledWith(
			[
				{
					categoryId,
					name: "Color",
					value: "Blue",
					isRequired: true,
					isVariant: true,
					sortOrder: 0,
				},
			],
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.CategoryAttributeOptions.bulkCreate).toHaveBeenCalledWith(
			[
				{
					categoryAttributeId: colorId,
					name: "Blue",
					hex: "#3B82F6",
					sortOrder: 0,
				},
			],
			{ transaction: { id: "database-transaction" } },
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 409 when creating a duplicate category name", async () => {
		const response = createResponse();
		const next = vi.fn();
		const error = new UniqueConstraintError({
			message: "duplicate key",
			errors: [],
		});

		db.Categories.create.mockRejectedValue(error);

		await createCategory(
			{
				body: {
					name: "Smartphone",
				},
			},
			response,
			next,
		);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message: "Category name already exists",
			}),
		);
	});

	it("updates a category name and active status", async () => {
		const response = createResponse();
		const next = vi.fn();
		const update = vi.fn().mockResolvedValue(undefined);
		const categoryToUpdate = {
			...category,
			update,
		};

		db.Categories.findByPk.mockResolvedValue(categoryToUpdate);

		await updateCategory(
			{
				params: { id: categoryId },
				body: {
					name: "  Mobile   Devices ",
					isActive: false,
				},
			},
			response,
			next,
		);

		expect(update).toHaveBeenCalledWith({
			name: "Mobile Devices",
			isActive: false,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Category updated successfully",
			data: categoryToUpdate,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 400 when no valid update field is provided", async () => {
		const response = createResponse();
		const next = vi.fn();

		db.Categories.findByPk.mockResolvedValue({
			...category,
			update: vi.fn(),
		});

		await updateCategory(
			{
				params: { id: categoryId },
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

	it("adds an attribute while retaining an unchanged attribute by id", async () => {
		const colorId = "55555555-5555-4555-8555-555555555555";
		const specId = "66666666-6666-4666-8666-666666666666";
		const existingColor = {
			id: colorId,
			name: "Color",
			sortOrder: 0,
			update: vi.fn(),
		};
		db.Categories.findByPk
			.mockResolvedValueOnce({ ...category, update: vi.fn() })
			.mockResolvedValueOnce({
				...category,
				attributes: [existingColor, { id: specId, name: "Spesifikasi" }],
			});
		db.CategoryAttributes.findAll.mockResolvedValue([existingColor]);
		db.CategoryAttributes.create.mockResolvedValue({ id: specId });
		const response = createResponse();
		const next = vi.fn();

		await updateCategory(
			{
				params: { id: categoryId },
				body: {
					attributes: [
						{ id: colorId, name: "Color" },
						{
							name: "Spesifikasi",
							value: "Storage",
							isRequired: true,
							isVariant: true,
							options: [{ name: "256GB" }, { name: "512GB" }],
						},
					],
				},
			},
			response,
			next,
		);

		expect(existingColor.update).not.toHaveBeenCalled();
		expect(db.CategoryAttributes.destroy).not.toHaveBeenCalled();
		expect(db.CategoryAttributes.create).toHaveBeenCalledWith(
			expect.objectContaining({
				categoryId,
				name: "Spesifikasi",
				value: "Storage",
				sortOrder: 1,
			}),
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.CategoryAttributeOptions.bulkCreate).toHaveBeenCalledWith(
			[
				{ categoryAttributeId: specId, name: "256GB", sortOrder: 0 },
				{ categoryAttributeId: specId, name: "512GB", sortOrder: 1 },
			],
			{ transaction: { id: "database-transaction" } },
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("updates changed option fields and removes an omitted unused option", async () => {
		const colorId = "55555555-5555-4555-8555-555555555555";
		const blueId = "66666666-6666-4666-8666-666666666666";
		const blackId = "77777777-7777-4777-8777-777777777777";
		const color = { id: colorId, name: "Color", sortOrder: 0, update: vi.fn() };
		const blue = { id: blueId, name: "Blue", sortOrder: 0, update: vi.fn() };
		const black = { id: blackId, name: "Black", sortOrder: 1, update: vi.fn() };
		db.Categories.findByPk.mockResolvedValue({ ...category, update: vi.fn() });
		db.CategoryAttributes.findAll.mockResolvedValue([color]);
		db.CategoryAttributeOptions.findAll.mockResolvedValue([blue, black]);
		db.ProductItemAttributeValues.count.mockResolvedValue(0);
		const next = vi.fn();

		await updateCategory(
			{
				params: { id: categoryId },
				body: {
					attributes: [
						{
							id: colorId,
							options: [{ id: blueId, hex: "#3b82f6" }],
						},
					],
				},
			},
			createResponse(),
			next,
		);

		expect(color.update).not.toHaveBeenCalled();
		expect(blue.update).toHaveBeenCalledWith(
			{ hex: "#3B82F6" },
			{ transaction: { id: "database-transaction" } },
		);
		expect(black.update).not.toHaveBeenCalled();
		expect(db.CategoryAttributeOptions.destroy).toHaveBeenCalledWith({
			where: { id: { [Op.in]: [blackId] } },
			transaction: { id: "database-transaction" },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("does not write an unchanged attribute or option", async () => {
		const colorId = "55555555-5555-4555-8555-555555555555";
		const blueId = "66666666-6666-4666-8666-666666666666";
		const color = { id: colorId, name: "Color", sortOrder: 0, update: vi.fn() };
		const blue = { id: blueId, name: "Blue", sortOrder: 0, update: vi.fn() };
		db.Categories.findByPk.mockResolvedValue({ ...category, update: vi.fn() });
		db.CategoryAttributes.findAll.mockResolvedValue([color]);
		db.CategoryAttributeOptions.findAll.mockResolvedValue([blue]);
		const next = vi.fn();

		await updateCategory(
			{
				params: { id: categoryId },
				body: {
					attributes: [
						{
							id: colorId,
							name: "Color",
							options: [{ id: blueId, name: "Blue" }],
						},
					],
				},
			},
			createResponse(),
			next,
		);

		expect(color.update).not.toHaveBeenCalled();
		expect(blue.update).not.toHaveBeenCalled();
		expect(db.CategoryAttributes.destroy).not.toHaveBeenCalled();
		expect(db.CategoryAttributeOptions.destroy).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects omission of an attribute used by a product variant", async () => {
		const colorId = "55555555-5555-4555-8555-555555555555";
		db.Categories.findByPk.mockResolvedValue({ ...category, update: vi.fn() });
		db.CategoryAttributes.findAll.mockResolvedValue([
			{ id: colorId, name: "Color", sortOrder: 0 },
		]);
		db.ProductItemAttributeValues.count.mockResolvedValue(1);
		const next = vi.fn();

		await updateCategory(
			{ params: { id: categoryId }, body: { attributes: [] } },
			createResponse(),
			next,
		);

		expect(db.CategoryAttributes.destroy).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message:
					"Category attributes already used by product variants cannot be removed",
			}),
		);
	});

	it("soft deletes an existing category", async () => {
		const response = createResponse();
		const next = vi.fn();
		const destroy = vi.fn().mockResolvedValue(undefined);

		db.Categories.findByPk.mockResolvedValue({
			...category,
			destroy,
		});

		await deleteCategory({ params: { id: categoryId } }, response, next);

		expect(destroy).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Category deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});
