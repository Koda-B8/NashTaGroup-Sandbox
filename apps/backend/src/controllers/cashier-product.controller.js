import { constants } from "node:http2";

import { Op } from "sequelize";

import { paginate } from "../lib/pagination.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid } from "../utils/validation.js";

const {
	Brands,
	Categories,
	Inventories,
	ProductImages,
	ProductItems,
	Products,
} = db;

// oxlint-disable-next-line unicorn/no-null -- The API represents a missing image explicitly as null.
const EMPTY_IMAGE = null;
const SORT_OPTIONS = {
	name_asc: [
		[{ model: Products, as: "product" }, "name", "ASC"],
		["name", "ASC"],
	],
	name_desc: [
		[{ model: Products, as: "product" }, "name", "DESC"],
		["name", "DESC"],
	],
	price_asc: [["price", "ASC"]],
	price_desc: [["price", "DESC"]],
};

const parsePrice = (value, field) => {
	if (value === undefined) return;
	if (typeof value !== "string" || !/^\d{1,13}(\.\d{1,2})?$/.test(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			`${field} must be a non-negative number with up to 2 decimal places`,
		);
	}

	return Number(value);
};

const findPrimaryImage = (images) =>
	images?.find((image) => image.isPrimary) ?? images?.[0];

const toCashierProductResponse = (productItem) => {
	const item =
		typeof productItem?.toJSON === "function"
			? productItem.toJSON()
			: productItem;
	const itemImage = findPrimaryImage(item.images);
	const productImage = findPrimaryImage(item.product?.images);
	const image = itemImage ?? productImage;

	return {
		product_item_id: item.id,
		product_id: item.productId,
		product_code: item.productCode,
		name: item.product?.name,
		variant_name: item.name,
		category: item.product?.category,
		brand: item.product?.brand,
		price: item.price,
		stock: item.inventory?.stock ?? 0,
		image: image?.imageUrl ?? EMPTY_IMAGE,
		alt: image?.alt ?? `${item.product?.name} ${item.name}`.trim(),
		is_available: (item.inventory?.stock ?? 0) > 0,
	};
};

export async function getCashierProducts(request, response, next) {
	try {
		const search = parseSearch(request.query.q);
		const categoryId = request.query.category_id;
		const brandId = request.query.brand_id;
		const inStock = parseBoolean(request.query.in_stock);
		const minimumPrice = parsePrice(request.query.min_price, "min_price");
		const maximumPrice = parsePrice(request.query.max_price, "max_price");
		const sort = request.query.sort ?? "name_asc";

		if (categoryId !== undefined && !isUuid(categoryId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"category_id must be a valid UUID",
			);
		}
		if (brandId !== undefined && !isUuid(brandId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"brand_id must be a valid UUID",
			);
		}
		if (request.query.in_stock !== undefined && inStock === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"in_stock must be true or false",
			);
		}
		if (
			minimumPrice !== undefined &&
			maximumPrice !== undefined &&
			minimumPrice > maximumPrice
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"min_price must not be greater than max_price",
			);
		}
		if (typeof sort !== "string" || !Object.hasOwn(SORT_OPTIONS, sort)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"sort must be name_asc, name_desc, price_asc, or price_desc",
			);
		}

		const itemWhere = { isActive: true };
		if (search) {
			itemWhere[Op.or] = [
				{ productCode: { [Op.iLike]: `%${search}%` } },
				{ name: { [Op.iLike]: `%${search}%` } },
				{ "$product.name$": { [Op.iLike]: `%${search}%` } },
			];
		}
		if (minimumPrice !== undefined || maximumPrice !== undefined) {
			itemWhere.price = {};
			if (minimumPrice !== undefined) itemWhere.price[Op.gte] = minimumPrice;
			if (maximumPrice !== undefined) itemWhere.price[Op.lte] = maximumPrice;
		}

		const productWhere = { isActive: true };
		if (categoryId !== undefined) productWhere.categoryId = categoryId;
		if (brandId !== undefined) productWhere.brandId = brandId;

		const inventoryWhere = {};
		if (inStock === true) inventoryWhere.stock = { [Op.gt]: 0 };
		if (inStock === false) inventoryWhere.stock = { [Op.lte]: 0 };

		const { rows, pagination } = await paginate(ProductItems, request.query, {
			where: itemWhere,
			include: [
				{
					model: Inventories,
					as: "inventory",
					attributes: ["stock"],
					where: inventoryWhere,
					required: true,
				},
				{
					model: ProductImages,
					as: "images",
					attributes: ["imageUrl", "alt", "isPrimary", "sortOrder"],
					required: false,
				},
				{
					model: Products,
					as: "product",
					attributes: ["id", "name"],
					where: productWhere,
					required: true,
					include: [
						{
							model: Categories,
							as: "category",
							attributes: ["id", "name"],
							where: { isActive: true },
							required: true,
						},
						{
							model: Brands,
							as: "brand",
							attributes: ["id", "name"],
							where: { isActive: true },
							required: true,
						},
						{
							model: ProductImages,
							as: "images",
							attributes: ["imageUrl", "alt", "isPrimary", "sortOrder"],
							// oxlint-disable-next-line unicorn/no-null -- Null selects product-level images only.
							where: { productItemId: null },
							required: false,
						},
					],
				},
			],
			order: SORT_OPTIONS[sort],
			distinct: true,
			subQuery: false,
		});

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Cashier products retrieved successfully",
			data: rows.map((item) => toCashierProductResponse(item)),
			meta: { pagination },
		});
	} catch (error) {
		return next(error);
	}
}
