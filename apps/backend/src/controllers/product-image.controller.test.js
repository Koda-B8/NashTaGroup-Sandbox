// oxlint-disable unicorn/no-null
import { constants } from "node:http2";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	deleteProductImage as deleteCloudinaryImage,
	uploadProductImage as uploadCloudinaryImage,
} from "../lib/cloudinary.js";
import db from "../models/index.cjs";
import {
	createAdditionalProductImage,
	createProductImage,
	deleteProductImage,
	getProductImages,
	replaceProductImage,
	retryProductImageCleanups,
	updateProductImage,
} from "./product-image.controller.js";

const databaseMocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("../lib/cloudinary.js", () => ({
	deleteProductImage: vi.fn(),
	uploadProductImage: vi.fn(),
}));

vi.mock("../models/index.cjs", () => ({
	default: {
		ProductImageCleanups: {
			findOrCreate: vi.fn(),
			findAll: vi.fn(),
			destroy: vi.fn(),
			count: vi.fn(),
		},
		ProductImages: {
			create: vi.fn(),
			findAll: vi.fn(),
			findByPk: vi.fn(),
			findOne: vi.fn(),
			update: vi.fn(),
		},
		Products: { findByPk: vi.fn() },
		sequelize: { transaction: databaseMocks.transaction },
	},
}));

const productId = "11111111-1111-4111-8111-111111111111";
const productItemId = "22222222-2222-4222-8222-222222222222";
const imageId = "33333333-3333-4333-8333-333333333333";

const cloudinaryImage = {
	publicId: "sandbox/products/new-image",
	url: "https://res.cloudinary.com/nashta/image/upload/new-image.webp",
};

const deleteCloudinaryImageMock = vi.mocked(deleteCloudinaryImage);
const uploadCloudinaryImageMock = vi.mocked(uploadCloudinaryImage);

const createResponse = () => ({
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
});

const createImageRecord = (overrides = {}) => {
	const image = {
		id: imageId,
		productId,
		imageUrl: cloudinaryImage.url,
		publicId: cloudinaryImage.publicId,
		alt: "Samsung Galaxy A55 Awesome Navy",
		isPrimary: true,
		sortOrder: 0,
		toJSON: vi.fn(),
		update: vi.fn(),
		destroy: vi.fn(),
		...overrides,
	};

	image.toJSON = vi.fn(() => ({
		id: image.id,
		productId: image.productId,
		imageUrl: image.imageUrl,
		publicId: image.publicId,
		alt: image.alt,
		isPrimary: image.isPrimary,
		sortOrder: image.sortOrder,
	}));
	image.update = vi.fn(async (updates) => {
		Object.assign(image, updates);
		return image;
	});
	image.destroy = vi.fn();

	return image;
};

describe("product image controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		db.Products.findByPk.mockResolvedValue({ id: productId });
		databaseMocks.transaction.mockImplementation((callback) =>
			callback({ id: "database-transaction" }),
		);
		uploadCloudinaryImageMock.mockResolvedValue(cloudinaryImage);
		deleteCloudinaryImageMock.mockResolvedValue({ result: "ok" });
		db.ProductImageCleanups.findOrCreate.mockResolvedValue([]);
		db.ProductImageCleanups.destroy.mockResolvedValue(1);
		db.ProductImageCleanups.count.mockResolvedValue(0);
		db.ProductImages.findOne.mockResolvedValue(null);
	});

	it("retrieves product-level images for management", async () => {
		const image = createImageRecord();
		db.ProductImages.findAll.mockResolvedValue([image]);
		const response = createResponse();
		const next = vi.fn();

		await getProductImages({ query: { productId } }, response, next);

		expect(db.ProductImages.findAll).toHaveBeenCalledWith({
			where: { productId },
			order: [
				["isPrimary", "DESC"],
				["sortOrder", "ASC"],
			],
		});
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product images retrieved successfully",
			data: [
				expect.objectContaining({
					id: imageId,
					productId,
				}),
			],
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects a product item filter on the image list", async () => {
		const next = vi.fn();

		await getProductImages(
			{ query: { productId, productItemId } },
			createResponse(),
			next,
		);

		expect(db.ProductImages.findAll).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Product item images are not supported",
			}),
		);
	});

	it("uploads and stores a product master image", async () => {
		const image = createImageRecord({ sortOrder: 1 });
		db.ProductImages.create.mockResolvedValue(image);
		const response = createResponse();
		const next = vi.fn();

		await createProductImage(
			{
				body: {
					productId,
					alt: " Samsung Galaxy A55 Awesome Navy ",
					isPrimary: "true",
					sortOrder: "1",
				},
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(uploadCloudinaryImageMock).toHaveBeenCalledOnce();
		expect(db.ProductImages.update).toHaveBeenCalledWith(
			{ isPrimary: false },
			expect.objectContaining({
				where: {
					productId,
					isPrimary: true,
				},
			}),
		);
		expect(db.ProductImages.create).toHaveBeenCalledWith(
			{
				productId,
				imageUrl: cloudinaryImage.url,
				publicId: cloudinaryImage.publicId,
				alt: "Samsung Galaxy A55 Awesome Navy",
				isPrimary: true,
				sortOrder: 1,
			},
			{ transaction: { id: "database-transaction" } },
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_CREATED);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product image uploaded successfully",
			data: {
				id: imageId,
				productId,
				image: {
					alt: image.alt,
					url: image.imageUrl,
				},
				isPrimary: true,
				sortOrder: 1,
			},
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("takes the product target from the route when adding another product image", async () => {
		const image = createImageRecord();
		db.ProductImages.findOne.mockResolvedValue(createImageRecord());
		db.ProductImages.create.mockResolvedValue(image);
		const response = createResponse();
		const next = vi.fn();

		await createAdditionalProductImage(
			{
				params: { id: productId },
				body: {
					productId: "44444444-4444-4444-8444-444444444444",
					alt: "Gallery image",
				},
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(db.ProductImages.create).toHaveBeenCalledWith(
			expect.objectContaining({
				productId,
				isPrimary: false,
			}),
			expect.any(Object),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("uses the target name as alt and makes the first image primary", async () => {
		db.Products.findByPk.mockResolvedValue({
			id: productId,
			name: "ASUS Vivobook 14",
		});
		const image = createImageRecord({
			alt: "ASUS Vivobook 14",
			isPrimary: true,
		});
		db.ProductImages.create.mockResolvedValue(image);
		const response = createResponse();
		const next = vi.fn();

		await createProductImage(
			{
				body: { productId, isPrimary: "false" },
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(db.ProductImages.create).toHaveBeenCalledWith(
			expect.objectContaining({
				alt: "ASUS Vivobook 14",
				isPrimary: true,
			}),
			expect.any(Object),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects primary image creation through the gallery endpoint", async () => {
		const next = vi.fn();
		await createAdditionalProductImage(
			{
				params: { id: productId },
				body: { alt: "New primary", isPrimary: "true" },
				file: { buffer: Buffer.from("image") },
			},
			createResponse(),
			next,
		);
		expect(uploadCloudinaryImageMock).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
			}),
		);
	});

	it("rejects a product item target on the gallery route", async () => {
		const response = createResponse();
		const next = vi.fn();

		await createAdditionalProductImage(
			{
				params: { id: productId },
				body: { productItemId, alt: "Variant image" },
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(db.ProductImages.create).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Product item images are not supported",
			}),
		);
	});

	it("rejects a product item target before upload", async () => {
		const response = createResponse();
		const next = vi.fn();

		await createProductImage(
			{
				body: { productId, productItemId, alt: "Variant image" },
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(uploadCloudinaryImageMock).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				statusCode: constants.HTTP_STATUS_BAD_REQUEST,
				message: "Product item images are not supported",
			}),
		);
	});

	it("removes a newly uploaded asset when database creation fails", async () => {
		db.ProductImages.create.mockRejectedValue(
			new Error("Database unavailable"),
		);
		const response = createResponse();
		const next = vi.fn();

		await createProductImage(
			{
				body: { productId, alt: "Variant image" },
				file: { buffer: Buffer.from("image") },
			},
			response,
			next,
		);

		expect(db.ProductImageCleanups.findOrCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { publicId: cloudinaryImage.publicId },
			}),
		);
		expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(
			cloudinaryImage.publicId,
		);
		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Database unavailable" }),
		);
	});

	it("updates image metadata without replacing the file", async () => {
		const image = createImageRecord({ isPrimary: false });
		db.ProductImages.findByPk.mockResolvedValue(image);
		const response = createResponse();
		const next = vi.fn();

		await updateProductImage(
			{
				params: { id: imageId },
				body: { alt: " Updated alt ", isPrimary: true, sortOrder: 2 },
			},
			response,
			next,
		);

		expect(db.ProductImages.update).toHaveBeenCalledOnce();
		expect(image.update).toHaveBeenCalledWith(
			{ alt: "Updated alt", isPrimary: true, sortOrder: 2 },
			{ transaction: { id: "database-transaction" } },
		);
		expect(uploadCloudinaryImageMock).not.toHaveBeenCalled();
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(next).not.toHaveBeenCalled();
	});

	it("promotes the next image when the current primary is unset", async () => {
		const image = createImageRecord({ isPrimary: true });
		const replacement = createImageRecord({
			id: "44444444-4444-4444-8444-444444444444",
			isPrimary: false,
		});
		db.ProductImages.findByPk.mockResolvedValue(image);
		db.ProductImages.findOne.mockResolvedValue(replacement);
		const response = createResponse();
		const next = vi.fn();

		await updateProductImage(
			{
				params: { id: imageId },
				body: { isPrimary: false },
			},
			response,
			next,
		);

		expect(image.update).toHaveBeenCalledWith(
			{ isPrimary: false },
			{ transaction: { id: "database-transaction" } },
		);
		expect(replacement.update).toHaveBeenCalledWith(
			{ isPrimary: true },
			{ transaction: { id: "database-transaction" } },
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("keeps the only image primary when it is unset", async () => {
		const image = createImageRecord({ isPrimary: true });
		db.ProductImages.findByPk.mockResolvedValue(image);
		db.ProductImages.findOne.mockResolvedValue(null);
		const response = createResponse();
		const next = vi.fn();

		await updateProductImage(
			{
				params: { id: imageId },
				body: { isPrimary: false },
			},
			response,
			next,
		);

		expect(image.update).not.toHaveBeenCalled();
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ isPrimary: true }),
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("replaces the Cloudinary file and removes the previous asset", async () => {
		const image = createImageRecord({
			imageUrl: "https://example.com/old.webp",
			publicId: "nashtagroup/products/old-image",
		});
		db.ProductImages.findByPk.mockResolvedValue(image);
		const response = createResponse();
		const next = vi.fn();

		await replaceProductImage(
			{
				params: { id: imageId },
				file: { buffer: Buffer.from("new-image") },
			},
			response,
			next,
		);

		expect(image.update).toHaveBeenCalledWith(
			{
				imageUrl: cloudinaryImage.url,
				publicId: cloudinaryImage.publicId,
			},
			{ transaction: { id: "database-transaction" } },
		);
		expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(
			"nashtagroup/products/old-image",
		);
		expect(response.status).toHaveBeenCalledWith(constants.HTTP_STATUS_OK);
		expect(next).not.toHaveBeenCalled();
	});

	it("deletes the database record and its Cloudinary asset", async () => {
		const image = createImageRecord();
		db.ProductImages.findByPk.mockResolvedValue(image);
		const response = createResponse();
		const next = vi.fn();

		await deleteProductImage({ params: { id: imageId } }, response, next);

		expect(image.destroy).toHaveBeenCalledWith({
			transaction: { id: "database-transaction" },
		});
		expect(deleteCloudinaryImageMock).toHaveBeenCalledWith(image.publicId);
		expect(response.json).toHaveBeenCalledWith({
			success: true,
			message: "Product image deleted successfully",
			cleanupPending: false,
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("promotes the next image when deleting the primary image", async () => {
		const image = createImageRecord({ isPrimary: true });
		const replacement = createImageRecord({
			id: "44444444-4444-4444-8444-444444444444",
			isPrimary: false,
		});
		db.ProductImages.findByPk.mockResolvedValue(image);
		db.ProductImages.findOne.mockResolvedValue(replacement);
		const response = createResponse();
		const next = vi.fn();

		await deleteProductImage({ params: { id: imageId } }, response, next);

		expect(replacement.update).toHaveBeenCalledWith(
			{ isPrimary: true },
			{ transaction: { id: "database-transaction" } },
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("retains a cleanup job when Cloudinary deletion fails", async () => {
		const image = createImageRecord();
		db.ProductImages.findByPk.mockResolvedValue(image);
		deleteCloudinaryImageMock.mockRejectedValue(
			new Error("Cloudinary unavailable"),
		);
		const response = createResponse();
		await deleteProductImage({ params: { id: imageId } }, response, vi.fn());
		expect(db.ProductImageCleanups.findOrCreate).toHaveBeenCalledWith(
			expect.objectContaining({ where: { publicId: image.publicId } }),
		);
		expect(db.ProductImageCleanups.destroy).not.toHaveBeenCalled();
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({ cleanupPending: true }),
		);
	});

	it("retries pending Cloudinary deletions", async () => {
		db.ProductImageCleanups.findAll.mockResolvedValue([
			{ publicId: cloudinaryImage.publicId },
		]);
		const response = createResponse();
		await retryProductImageCleanups({}, response, vi.fn());
		expect(db.ProductImageCleanups.destroy).toHaveBeenCalledWith({
			where: { publicId: cloudinaryImage.publicId },
		});
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({ data: { cleared: 1, remaining: 0 } }),
		);
	});

	it("clears a cleanup job when Cloudinary reports the asset no longer exists", async () => {
		deleteCloudinaryImageMock.mockResolvedValue({ result: "not found" });
		db.ProductImageCleanups.findAll.mockResolvedValue([
			{ publicId: cloudinaryImage.publicId },
		]);
		const response = createResponse();
		await retryProductImageCleanups({}, response, vi.fn());
		expect(response.json).toHaveBeenCalledWith(
			expect.objectContaining({ data: { cleared: 1, remaining: 0 } }),
		);
	});
});
