import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import db from "../models/index.cjs";
import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategoryById,
	updateCategory,
} from "./category.controller.js";

vi.mock("../models/index.cjs", () => ({
	default: {
		Categories: {
			create: vi.fn(),
			findAll: vi.fn(),
			findByPk: vi.fn(),
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

		expect(db.Categories.findByPk).toHaveBeenCalledWith(categoryId);
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
