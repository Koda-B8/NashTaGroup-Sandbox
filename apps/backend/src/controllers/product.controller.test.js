import { constants } from "node:http2";

import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	deleteProductImage as deleteCloudinaryImage,
	uploadProductImage as uploadCloudinaryImage,
} from "../lib/cloudinary.js";
import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import {
	createProduct,
	deleteProduct,
	getProductById,
	getProducts,
	updateProduct,
} from "./product.controller.js";

const databaseMocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("../lib/cloudinary.js", () => ({
	deleteProductImage: vi.fn(),
	uploadProductImage: vi.fn(),
}));

vi.mock("../lib/pagination.js", () => ({ paginate: vi.fn() }));

vi.mock("../models/index.cjs", () => ({
	default: {
		Brands: { findByPk: vi.fn() },
		Categories: { findByPk: vi.fn() },
		CategoryAttributeOptions: {},
		CategoryAttributes: {},
		Inventories: { create: vi.fn() },
		ProductImageCleanups: {
			findOrCreate: vi.fn(),
			destroy: vi.fn(),
		},
		ProductImages: {
			create: vi.fn(),
			findOne: vi.fn(),
			update: vi.fn(),
		},
		ProductItemAttributeValues: { bulkCreate: vi.fn() },
		ProductItems: { count: vi.fn(), create: vi.fn() },
		Products: {
			create: vi.fn(),
			findByPk: vi.fn(),
		},
		sequelize: { transaction: databaseMocks.transaction },
	},
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const brandId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";

const activeCategory = {
	id: categoryId,
	name: "Smartphone",
	isActive: true,
};

const activeBrand = {
	id: brandId,
	name: "Samsung",
	isActive: true,
};

const product = {
	id: productId,
	categoryId,
	brandId,
	name: "Samsung Galaxy A55",
	description: "Samsung Galaxy A55 smartphone.",
	isActive: true,
};

const productWithStock = {
	...product,
	stock: 0,
	items: [],
};

const cloudinaryImage = {
	publicId: "Sandbox/products/galaxy-a55",
	url: "https://res.cloudinary.com/nashta/image/upload/f_auto,q_auto/galaxy-a55",
};

const uploadCloudinaryImageMock = vi.mocked(uploadCloudinaryImage);
const deleteCloudinaryImageMock = vi.mocked(deleteCloudinaryImage);

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

describe("product controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		db.Categories.findByPk.mockResolvedValue(activeCategory);
		db.Brands.findByPk.mockResolvedValue(activeBrand);
		db.ProductItems.count.mockResolvedValue(0);
		databaseMocks.transaction.mockImplementation((callback) =>
			callback({ id: "database-transaction" }),
		);
		uploadCloudinaryImageMock.mockResolvedValue(cloudinaryImage);
		deleteCloudinaryImageMock.mockResolvedValue({ result: "ok" });
		db.ProductImageCleanups.findOrCreate.mockResolvedValue([]);
		db.ProductImageCleanups.destroy.mockResolvedValue(1);
	});

	it("retrieves products with search and filters", async () => {
		vi.mocked(paginate).mockResolvedValue({
			rows: [
				{
					...product,
					images: [
						{
							imageUrl:
								"https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp",
							alt: "Samsung Galaxy A55 smartphone",
							isPrimary: true,
							sortOrder: 0,
						},
					],
					items: [
						{
							id: "44444444-4444-4444-8444-444444444444",
							name: "8GB/128GB - Awesome Navy",
							inventory: { stock: 10 },
							images: [
								{
									imageUrl:
										"https://res.cloudinary.com/nashta/image/upload/galaxy-a55-navy.webp",
									alt: "Samsung Galaxy A55 Awesome Navy",
									isPrimary: true,
									sortOrder: 0,
								},
							],
						},
						{
							id: "55555555-5555-4555-8555-555555555555",
							name: "8GB/256GB - Ice Blue",
							inventory: { stock: 7 },
						},
					],
				},
			],
			pagination: { page: 2, limit: 10, total_items: 1, total_pages: 1 },
		});
		const response = createResponse();
		const next = vi.fn();

		await getProducts(
			{
				query: {
					search: "Galaxy",
					categoryId,
					brandId,
					isActive: "true",
					page: "2",
					limit: "10",
				},
			},
			response,
			next,
		);

		const options = vi.mocked(paginate).mock.calls[0]?.[2];

		expect(options?.where.categoryId).toBe(categoryId);
		expect(options?.where.brandId).toBe(brandId);
		expect(options?.where.isActive).toBe(true);
		expect(options?.where.name[Op.iLike]).toBe("%Galaxy%");
		expect(options).toMatchObject({
			order: [["name", "ASC"]],
			distinct: true,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Products retrieved successfully",
			data: [
				{
					...product,
					image: {
						alt: "Samsung Galaxy A55 smartphone",
						url: "https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp",
					},
					stock: 17,
					items: [
						{
							id: "44444444-4444-4444-8444-444444444444",
							name: "8GB/128GB - Awesome Navy",
							image: {
								alt: "Samsung Galaxy A55 Awesome Navy",
								url: "https://res.cloudinary.com/nashta/image/upload/galaxy-a55-navy.webp",
							},
							stock: 10,
						},
						{
							id: "55555555-5555-4555-8555-555555555555",
							name: "8GB/256GB - Ice Blue",
							image: {
								alt: "Samsung Galaxy A55 smartphone",
								url: "https://res.cloudinary.com/nashta/image/upload/galaxy-a55.webp",
							},
							stock: 7,
						},
					],
				},
			],
			meta: {
				pagination: { page: 2, limit: 10, total_items: 1, total_pages: 1 },
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("creates a product with valid category and brand", async () => {
		db.Products.create.mockResolvedValue({ id: productId });
		db.Products.findByPk.mockResolvedValue({ ...product, items: [] });

		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: "  Samsung   Galaxy A55  ",
					description: " Samsung Galaxy A55 smartphone. ",
				},
			},
			response,
			next,
		);

		expect(db.Categories.findByPk).toHaveBeenCalledWith(
			categoryId,
			expect.objectContaining({ include: expect.any(Array) }),
		);
		expect(db.Brands.findByPk).toHaveBeenCalledWith(brandId);
		expect(db.Products.create).toHaveBeenCalledWith({
			categoryId,
			brandId,
			name: "Samsung Galaxy A55",
			description: "Samsung Galaxy A55 smartphone.",
			isActive: true,
		});
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product created successfully",
			data: productWithStock,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("creates product items with names derived from category attributes", async () => {
		const colorAttributeId = "44444444-4444-4444-8444-444444444444";
		const storageAttributeId = "55555555-5555-4555-8555-555555555555";
		const blueOptionId = "66666666-6666-4666-8666-666666666666";
		const storageOptionId = "77777777-7777-4777-8777-777777777777";
		db.Categories.findByPk.mockResolvedValue({
			...activeCategory,
			attributes: [
				{
					id: colorAttributeId,
					name: "Colors",
					isRequired: true,
					isVariant: true,
					sortOrder: 0,
					options: [{ id: blueOptionId, name: "Blue" }],
				},
				{
					id: storageAttributeId,
					name: "Spesifikasi",
					isRequired: true,
					isVariant: true,
					sortOrder: 1,
					options: [{ id: storageOptionId, name: "512GB" }],
				},
			],
		});
		db.Products.create.mockResolvedValue({ id: productId });
		db.ProductItems.create.mockResolvedValue({
			id: "88888888-8888-4888-8888-888888888888",
		});
		db.Products.findByPk.mockResolvedValue({ ...product, items: [] });
		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: product.name,
					items: [
						{
							productCode: "SAM-A55-BLU-512",
							price: "6499000",
							stock: 10,
							attributes: [
								{ attributeId: colorAttributeId, optionId: blueOptionId },
								{
									attributeId: storageAttributeId,
									optionId: storageOptionId,
								},
							],
						},
					],
				},
			},
			response,
			next,
		);

		expect(db.ProductItems.create).toHaveBeenCalledWith(
			expect.objectContaining({
				productId,
				name: "Blue 512GB",
				productCode: "SAM-A55-BLU-512",
				variantSignature: expect.any(String),
			}),
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.Inventories.create).toHaveBeenCalledWith(
			expect.objectContaining({ stock: 10 }),
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.ProductItemAttributeValues.bulkCreate).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					categoryAttributeOptionId: blueOptionId,
					value: "Blue",
				}),
			]),
			{ transaction: { id: "database-transaction" } },
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("creates a product and optional image in one multipart request", async () => {
		db.Products.create.mockResolvedValue({ id: productId });
		db.Products.findByPk.mockResolvedValue({ ...product, items: [] });
		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: { categoryId, brandId, name: product.name, isActive: "false" },
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(db.Products.create).toHaveBeenCalledWith(
			expect.objectContaining({ name: product.name, isActive: false }),
			{ transaction: { id: "database-transaction" } },
		);
		expect(db.ProductImages.create).toHaveBeenCalledWith(
			{
				productId,
				productItemId: null,
				imageUrl: cloudinaryImage.url,
				publicId: cloudinaryImage.publicId,
				alt: product.name,
				isPrimary: true,
				sortOrder: 0,
			},
			{ transaction: { id: "database-transaction" } },
		);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product created successfully",
			data: {
				...productWithStock,
				image: { alt: product.name, url: cloudinaryImage.url },
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("cleans up a newly uploaded asset when product creation fails", async () => {
		db.Products.create.mockRejectedValue(new Error("Database unavailable"));
		const next = vi.fn();
		await createProduct(
			{
				body: { categoryId, brandId, name: product.name },
				file: { buffer: Buffer.from("image") },
			},
			createResponse(),
			next,
		);
		expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(
			cloudinaryImage.publicId,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Database unavailable" }),
		);
	});

	it("retrieves product details with aggregate and per-item stock", async () => {
		db.Products.findByPk.mockResolvedValue({
			...product,
			items: [
				{
					id: "44444444-4444-4444-8444-444444444444",
					name: "8GB/128GB - Awesome Navy",
					inventory: { stock: 10 },
				},
				{
					id: "55555555-5555-4555-8555-555555555555",
					name: "8GB/256GB - Ice Blue",
					inventory: { stock: 7 },
				},
			],
		});
		const response = createResponse();
		const next = vi.fn();

		await getProductById({ params: { id: productId } }, response, next);

		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product retrieved successfully",
			data: expect.objectContaining({
				...product,
				image: { alt: "Samsung Galaxy A55", url: null },
				stock: 17,
				items: [
					expect.objectContaining({
						id: "44444444-4444-4444-8444-444444444444",
						name: "8GB/128GB - Awesome Navy",
						image: { alt: "8GB/128GB - Awesome Navy", url: null },
						stock: 10,
					}),
					expect.objectContaining({
						id: "55555555-5555-4555-8555-555555555555",
						name: "8GB/256GB - Ice Blue",
						image: { alt: "8GB/256GB - Ice Blue", url: null },
						stock: 7,
					}),
				],
			}),
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 400 when the product name is missing", async () => {
		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: "   ",
				},
			},
			response,
			next,
		);

		expect(db.Products.create).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Product name is required",
			}),
		);
	});

	it("returns 400 when the category is inactive", async () => {
		db.Categories.findByPk.mockResolvedValue({
			...activeCategory,
			isActive: false,
		});

		const response = createResponse();
		const next = vi.fn();

		await createProduct(
			{
				body: {
					categoryId,
					brandId,
					name: "Samsung Galaxy A55",
				},
			},
			response,
			next,
		);

		expect(db.Products.create).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Category is inactive",
			}),
		);
	});

	it("returns 400 when no valid update field is provided", async () => {
		db.Products.findByPk.mockResolvedValue({
			...product,
			update: vi.fn(),
		});

		const response = createResponse();
		const next = vi.fn();

		await updateProduct(
			{
				params: { id: productId },
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

	it("rejects changing category while product items still exist", async () => {
		const nextCategoryId = "99999999-9999-4999-8999-999999999999";
		db.Products.findByPk.mockResolvedValue({ ...product, update: vi.fn() });
		db.ProductItems.count.mockResolvedValue(1);
		const response = createResponse();
		const next = vi.fn();

		await updateProduct(
			{
				params: { id: productId },
				body: { categoryId: nextCategoryId },
			},
			response,
			next,
		);

		expect(db.ProductItems.count).toHaveBeenCalledWith({
			where: { productId },
		});
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_CONFLICT,
				message:
					"Product category cannot be changed while product items still exist",
			}),
		);
	});

	it("replaces the primary product image in the same update request", async () => {
		const update = vi.fn();
		const primaryImage = {
			publicId: "Sandbox/products/previous",
			alt: "Previous alt",
			update: vi.fn(),
		};
		db.Products.findByPk.mockResolvedValue({ ...product, update, items: [] });
		db.ProductImages.findOne.mockResolvedValue(primaryImage);
		const response = createResponse();
		const next = vi.fn();

		await updateProduct(
			{
				params: { id: productId },
				body: { name: "Samsung Galaxy A56" },
				file: { buffer: Buffer.from("replacement") },
			},
			response,
			next,
		);

		expect(update).toHaveBeenCalledWith(
			{ name: "Samsung Galaxy A56" },
			{ transaction: { id: "database-transaction" } },
		);
		expect(primaryImage.update).toHaveBeenCalledWith(
			{
				imageUrl: cloudinaryImage.url,
				publicId: cloudinaryImage.publicId,
				alt: "Samsung Galaxy A56",
			},
			{ transaction: { id: "database-transaction" } },
		);
		expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(
			primaryImage.publicId,
		);
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				cleanupPending: false,
				data: expect.objectContaining({
					image: { alt: "Samsung Galaxy A56", url: cloudinaryImage.url },
				}),
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("keeps a cleanup job when the replaced Cloudinary asset cannot be removed", async () => {
		const previousPublicId = "Sandbox/products/previous";
		db.Products.findByPk.mockResolvedValue({
			...product,
			update: vi.fn(),
			items: [],
		});
		db.ProductImages.findOne.mockResolvedValue({
			publicId: previousPublicId,
			update: vi.fn(),
		});
		deleteCloudinaryImageMock.mockRejectedValue(
			new Error("Cloudinary unavailable"),
		);
		const response = createResponse();

		await updateProduct(
			{
				params: { id: productId },
				body: {},
				file: { buffer: Buffer.from("image") },
			},
			response,
			vi.fn(),
		);

		expect(db.ProductImageCleanups.findOrCreate).toHaveBeenCalledWith(
			expect.objectContaining({ where: { publicId: previousPublicId } }),
		);
		expect(db.ProductImageCleanups.destroy).not.toHaveBeenCalled();
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({ cleanupPending: true }),
		);
	});

	it("accepts an image-only product update", async () => {
		const update = vi.fn();
		db.Products.findByPk.mockResolvedValue({ ...product, update, items: [] });
		db.ProductImages.findOne.mockResolvedValue(null);
		const response = createResponse();
		await updateProduct(
			{
				params: { id: productId },
				body: {},
				file: { buffer: Buffer.from("image") },
			},
			response,
			vi.fn(),
		);
		expect(update).not.toHaveBeenCalled();
		expect(db.ProductImages.create).toHaveBeenCalledWith(
			expect.objectContaining({ alt: product.name, isPrimary: true }),
			{ transaction: { id: "database-transaction" } },
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
	});

	it("updates the primary image alt when the product name changes without a file", async () => {
		const update = vi.fn();
		db.Products.findByPk.mockResolvedValue({ ...product, update, items: [] });
		const response = createResponse();
		await updateProduct(
			{ params: { id: productId }, body: { name: "Samsung Galaxy A56" } },
			response,
			vi.fn(),
		);
		expect(db.ProductImages.update).toHaveBeenCalledWith(
			{ alt: "Samsung Galaxy A56" },
			expect.objectContaining({
				where: { productId, productItemId: null, isPrimary: true },
			}),
		);
		expect(uploadCloudinaryImageMock).not.toHaveBeenCalled();
	});

	it("soft deletes an existing product", async () => {
		const destroy = vi.fn();
		db.Products.findByPk.mockResolvedValue({
			...product,
			destroy,
		});

		const response = createResponse();
		const next = vi.fn();

		await deleteProduct({ params: { id: productId } }, response, next);

		expect(destroy).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});
