// oxlint-disable unicorn/no-null
import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import {
	deleteProductImage as deleteCloudinaryImage,
	uploadProductImage as uploadCloudinaryImage,
} from "../lib/cloudinary.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const {
	ProductImageCleanups,
	ProductImages,
	ProductItems,
	Products,
	sequelize,
} = db;

const parseBooleanField = (value, field) => {
	if (value === undefined) return;
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;

	throw createHttpError(
		constants.HTTP_STATUS_BAD_REQUEST,
		`${field} must be true or false`,
	);
};

const parseSortOrder = (value) => {
	if (value === undefined) return;
	const parsed =
		typeof value === "string" && /^\d+$/.test(value.trim())
			? Number(value)
			: value;

	if (!Number.isInteger(parsed) || parsed < 0) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"sortOrder must be a non-negative integer",
		);
	}

	return parsed;
};

const validateAlt = (alt, emptyMessage) => {
	if (!alt) {
		throw createHttpError(constants.HTTP_STATUS_BAD_REQUEST, emptyMessage);
	}
	if (alt.length > 255) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Image alt must not exceed 255 characters",
		);
	}
};

const toProductImageResponse = (image) => {
	const value = typeof image?.toJSON === "function" ? image.toJSON() : image;

	return {
		id: value.id,
		productId: value.productId,
		productItemId: value.productItemId ?? null,
		image: {
			alt: value.alt,
			url: value.imageUrl,
		},
		isPrimary: value.isPrimary,
		sortOrder: value.sortOrder,
	};
};

const getImage = async (id) => {
	if (!isUuid(id)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"Product image id must be a valid UUID",
		);
	}

	const image = await ProductImages.findByPk(id);
	if (!image) {
		throw createHttpError(
			constants.HTTP_STATUS_NOT_FOUND,
			"Product image not found",
		);
	}

	return image;
};

const validateTarget = async (productId, productItemId) => {
	if (!isUuid(productId)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"productId must be a valid UUID",
		);
	}
	if (productItemId !== undefined && !isUuid(productItemId)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"productItemId must be a valid UUID",
		);
	}

	const product = await Products.findByPk(productId);
	if (!product) {
		throw createHttpError(constants.HTTP_STATUS_NOT_FOUND, "Product not found");
	}

	if (productItemId !== undefined) {
		const productItem = await ProductItems.findByPk(productItemId);
		if (!productItem) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product item not found",
			);
		}
		if (productItem.productId !== productId) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product item does not belong to the selected product",
			);
		}
	}
};

const unsetCurrentPrimary = (image, transaction) => {
	if (!image.isPrimary) return;

	return ProductImages.update(
		{ isPrimary: false },
		{
			where: {
				id: { [Op.ne]: image.id },
				productId: image.productId,
				productItemId: image.productItemId ?? null,
				isPrimary: true,
			},
			transaction,
		},
	);
};

const uploadImage = async (buffer) => {
	try {
		return await uploadCloudinaryImage(buffer);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		throw createHttpError(
			constants.HTTP_STATUS_BAD_GATEWAY,
			`Cloudinary upload failed: ${message}`,
		);
	}
};

const cleanupCloudinaryImage = async (publicId) => {
	if (!publicId) return true;
	try {
		const result = await deleteCloudinaryImage(publicId);
		if (result?.result !== "ok" && result?.result !== "not found") {
			throw new Error("Cloudinary did not confirm image deletion");
		}
		await ProductImageCleanups.destroy({ where: { publicId } });
		return true;
	} catch (error) {
		console.error("Failed to delete Cloudinary product image", error);
		return false;
	}
};

const enqueueCleanup = (publicId, transaction) => {
	if (!publicId) return;
	return ProductImageCleanups.findOrCreate({
		where: { publicId },
		defaults: { publicId },
		transaction,
	});
};

const cleanupFailedUpload = async (publicId) => {
	try {
		await enqueueCleanup(publicId);
	} catch (error) {
		console.error(
			"Could not queue cleanup of failed product image upload",
			error,
		);
	}
	await cleanupCloudinaryImage(publicId);
};

export async function retryProductImageCleanups(_request, response, next) {
	try {
		const pending = await ProductImageCleanups.findAll({
			limit: 100,
			order: [["createdAt", "ASC"]],
		});
		let cleared = 0;
		for (const job of pending) {
			if (await cleanupCloudinaryImage(job.publicId)) cleared++;
		}
		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product image cleanup retry finished",
			data: { cleared, remaining: await ProductImageCleanups.count() },
		});
	} catch (error) {
		return next(error);
	}
}

export async function getProductImages(request, response, next) {
	try {
		const productId = request.query?.productId;
		const productItemId = request.query?.productItemId || undefined;

		await validateTarget(productId, productItemId);

		const images = await ProductImages.findAll({
			where: {
				productId,
				productItemId: productItemId ?? null,
			},
			order: [
				["isPrimary", "DESC"],
				["sortOrder", "ASC"],
			],
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product images retrieved successfully",
			data: images.map((image) => toProductImageResponse(image)),
		});
	} catch (error) {
		return next(error);
	}
}

export async function createProductImage(request, response, next) {
	let uploadedImage;

	try {
		if (!request.file) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Image file is required",
			);
		}

		const productId = request.body?.productId;
		const productItemId = request.body?.productItemId || undefined;
		const alt = normalizeText(request.body?.alt);
		const isPrimary = parseBooleanField(request.body?.isPrimary, "isPrimary");
		const sortOrder = parseSortOrder(request.body?.sortOrder);

		validateAlt(alt, "Image alt is required");

		await validateTarget(productId, productItemId);
		uploadedImage = await uploadImage(request.file.buffer);

		const image = await sequelize.transaction(async (transaction) => {
			if (isPrimary) {
				await ProductImages.update(
					{ isPrimary: false },
					{
						where: {
							productId,
							productItemId: productItemId ?? null,
							isPrimary: true,
						},
						transaction,
					},
				);
			}

			return ProductImages.create(
				{
					productId,
					productItemId: productItemId ?? null,
					imageUrl: uploadedImage.url,
					publicId: uploadedImage.publicId,
					alt,
					isPrimary: isPrimary ?? false,
					sortOrder: sortOrder ?? 0,
				},
				{ transaction },
			);
		});
		uploadedImage = undefined;

		return response.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Product image uploaded successfully",
			data: toProductImageResponse(image),
		});
	} catch (error) {
		if (uploadedImage) {
			await cleanupFailedUpload(uploadedImage.publicId);
		}

		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"A primary image already exists for this target",
				),
			);
		}

		return next(error);
	}
}

export function createAdditionalProductImage(request, response, next) {
	if (
		request.body?.isPrimary !== undefined &&
		request.body.isPrimary !== false &&
		request.body.isPrimary !== "false"
	) {
		return next(
			createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Use the product update endpoint to replace its primary image",
			),
		);
	}
	request.body = {
		...request.body,
		productId: request.params.id,
		productItemId: undefined,
		isPrimary: false,
	};
	return createProductImage(request, response, next);
}

export async function createProductItemImage(request, response, next) {
	try {
		if (!isUuid(request.params.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Product item id must be a valid UUID",
			);
		}
		const item = await ProductItems.findByPk(request.params.id);
		if (!item) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Product item not found",
			);
		}
		request.body = {
			...request.body,
			productId: item.productId,
			productItemId: item.id,
		};
		return createProductImage(request, response, next);
	} catch (error) {
		return next(error);
	}
}

export async function updateProductImage(request, response, next) {
	try {
		const image = await getImage(request.params.id);
		const updates = {};

		if (Object.hasOwn(request.body ?? {}, "alt")) {
			const alt = normalizeText(request.body.alt);
			validateAlt(alt, "Image alt cannot be empty");
			updates.alt = alt;
		}
		if (Object.hasOwn(request.body ?? {}, "isPrimary")) {
			updates.isPrimary = parseBooleanField(
				request.body.isPrimary,
				"isPrimary",
			);
		}
		if (Object.hasOwn(request.body ?? {}, "sortOrder")) {
			updates.sortOrder = parseSortOrder(request.body.sortOrder);
		}

		if (Object.keys(updates).length === 0) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		await sequelize.transaction(async (transaction) => {
			await unsetCurrentPrimary(
				{ ...image.toJSON(), isPrimary: updates.isPrimary === true },
				transaction,
			);
			await image.update(updates, { transaction });
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product image updated successfully",
			data: toProductImageResponse(image),
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"A primary image already exists for this target",
				),
			);
		}

		return next(error);
	}
}

export async function replaceProductImage(request, response, next) {
	let uploadedImage;

	try {
		if (!request.file) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Image file is required",
			);
		}

		const image = await getImage(request.params.id);
		const previousPublicId = image.publicId;
		uploadedImage = await uploadImage(request.file.buffer);
		await sequelize.transaction(async (transaction) => {
			await enqueueCleanup(previousPublicId, transaction);
			await image.update(
				{
					imageUrl: uploadedImage.url,
					publicId: uploadedImage.publicId,
				},
				{ transaction },
			);
		});
		uploadedImage = undefined;
		const cleanupPending = !(await cleanupCloudinaryImage(previousPublicId));

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product image file replaced successfully",
			data: toProductImageResponse(image),
			cleanupPending,
		});
	} catch (error) {
		if (uploadedImage) {
			await cleanupFailedUpload(uploadedImage.publicId);
		}
		return next(error);
	}
}

export async function deleteProductImage(request, response, next) {
	try {
		const image = await getImage(request.params.id);
		const publicId = image.publicId;

		await sequelize.transaction(async (transaction) => {
			await enqueueCleanup(publicId, transaction);
			await image.destroy({ transaction });
		});
		const cleanupPending = !(await cleanupCloudinaryImage(publicId));

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Product image deleted successfully",
			cleanupPending,
		});
	} catch (error) {
		return next(error);
	}
}
