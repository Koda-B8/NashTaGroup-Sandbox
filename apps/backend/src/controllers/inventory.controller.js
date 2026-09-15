import { constants } from "node:http2";

import { Op } from "sequelize";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { isUuid } from "../utils/validation.js";

const {
	Brands,
	Categories,
	Inventories,
	InventoryMovements,
	ProductItems,
	Products,
} = db;

const STOCK_STATUSES = new Set(["available", "low", "out_of_stock"]);
const ADJUSTMENT_TYPES = new Set(["addition", "reduction", "correction"]);

const getStockStatus = (stock) => {
	if (stock === 0) return "out_of_stock";
	if (stock < 10) return "low";

	return "available";
};

const toInventoryResponse = (productItem) => {
	const value =
		typeof productItem.toJSON === "function"
			? productItem.toJSON()
			: productItem;

	const stock = value.inventory.stock;

	return {
		product_item_id: value.id,
		product_code: value.productCode,
		product_name: value.product.name,
		variant_name: value.name,
		brand: value.product.brand.name,
		category: value.product.category.name,
		stock,
		stock_status: getStockStatus(stock),
	};
};

export async function getInventories(request, response, next) {
	try {
		const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
		const categoryId = request.query.category_id;
		const brandId = request.query.brand_id;
		const stockStatus = request.query.stock_status;

		if (categoryId && !isUuid(categoryId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"category_id must be a valid UUID",
			);
		}

		if (brandId && !isUuid(brandId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"brand_id must be a valid UUID",
			);
		}

		if (stockStatus && !STOCK_STATUSES.has(stockStatus)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"stock_status must be available, low, or out_of_stock",
			);
		}

		const productItemWhere = {
			isActive: true,
		};

		const inventoryWhere = {};

		if (q) {
			productItemWhere[Op.or] = [
				{ productCode: { [Op.iLike]: `%${q}%` } },
				{ name: { [Op.iLike]: `%${q}%` } },
				{ "$product.name$": { [Op.iLike]: `%${q}%` } },
			];
		}

		if (stockStatus === "out_of_stock") {
			inventoryWhere.stock = 0;
		}

		if (stockStatus === "low") {
			inventoryWhere.stock = {
				[Op.between]: [1, 9],
			};
		}

		if (stockStatus === "available") {
			inventoryWhere.stock = {
				[Op.gte]: 10,
			};
		}

		const { rows, pagination } = await paginate(ProductItems, request.query, {
			where: productItemWhere,
			attributes: ["id", "productCode", "name"],
			include: [
				{
					model: Inventories,
					as: "inventory",
					attributes: ["stock"],
					where: inventoryWhere,
					required: true,
				},
				{
					model: Products,
					as: "product",
					attributes: ["id", "name"],
					where: { isActive: true },
					required: true,
					include: [
						{
							model: Categories,
							as: "category",
							attributes: ["id", "name"],
							where: {
								isActive: true,
								...(categoryId ? { id: categoryId } : {}),
							},
							required: true,
						},
						{
							model: Brands,
							as: "brand",
							attributes: ["id", "name"],
							where: {
								isActive: true,
								...(brandId ? { id: brandId } : {}),
							},
							required: true,
						},
					],
				},
			],
			order: [["createdAt", "DESC"]],
			distinct: true,
			subQuery: false,
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Inventories retrieved successfully",
			data: rows.map((row) => toInventoryResponse(row)),
			meta: {
				pagination,
			},
		});
	} catch (error) {
		return next(error);
	}
}

export async function adjustStock(request, response, next) {
	try {
		const { productItemId } = request.params;
		const { type, quantity, note } = request.body ?? {};

		if (!isUuid(productItemId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"productItemId must be a valid UUID",
			);
		}

		if (!ADJUSTMENT_TYPES.has(type)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"type must be addition, reduction, or correction",
			);
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"quantity must be a positive integer",
			);
		}

		if (note !== undefined && typeof note !== "string") {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"note must be a string",
			);
		}

		const result = await db.sequelize.transaction(async (transaction) => {
			const productItem = await ProductItems.findByPk(productItemId, {
				attributes: ["id"],
				transaction,
			});

			if (!productItem) {
				throw createHttpError(
					constants.HTTP_STATUS_NOT_FOUND,
					"Product item not found",
				);
			}

			const inventory = await Inventories.findOne({
				where: { productItemId },
				transaction,
				lock: transaction.LOCK.UPDATE,
			});

			if (!inventory) {
				throw createHttpError(
					constants.HTTP_STATUS_NOT_FOUND,
					"Inventory not found",
				);
			}

			const stockBefore = inventory.stock;
			let stockAfter = stockBefore;

			if (type === "addition") {
				stockAfter += quantity;
			}

			if (type === "reduction") {
				stockAfter -= quantity;
			}

			if (type === "correction") {
				stockAfter = quantity;
			}

			if (stockAfter < 0) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"Stock cannot be negative",
				);
			}

			await inventory.update(
				{
					stock: stockAfter,
				},
				{ transaction },
			);

			const inventoryMovement = await InventoryMovements.create(
				{
					productItemId,
					transactionId: null,
					userId: request.user.id,
					type,
					quantity,
					stockBefore,
					stockAfter,
					note: typeof note === "string" ? note.trim() || null : null,
				},
				{ transaction },
			);

			return {
				productItemId,
				type,
				quantity,
				stockBefore,
				stockAfter,
				note: inventoryMovement.note,
				createdAt: inventoryMovement.createdAt,
			};
		});

		return response.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Stock adjusted successfully",
			data: {
				product_item_id: result.productItemId,
				type: result.type,
				quantity: result.quantity,
				stock_before: result.stockBefore,
				stock_after: result.stockAfter,
				note: result.note,
				created_at: result.createdAt,
			},
		});
	} catch (error) {
		return next(error);
	}
}
