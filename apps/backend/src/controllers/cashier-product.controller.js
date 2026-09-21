import { constants } from "node:http2";

import { Op } from "sequelize";

import {
	createPaginationMetadata,
	parsePagination,
} from "../lib/pagination.js";
import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid } from "../utils/validation.js";

const {
	Brands,
	Categories,
	CategoryAttributeOptions,
	CategoryAttributes,
	Inventories,
	ProductImages,
	ProductItemAttributeValues,
	ProductItems,
	Products,
} = db;

// oxlint-disable-next-line unicorn/no-null -- The API represents a missing image explicitly as null.
const EMPTY_IMAGE = null;
const SORT_OPTIONS = new Set([
	"name_asc",
	"name_desc",
	"price_asc",
	"price_desc",
]);

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

const priceInCents = (price) => Math.round(Number(price) * 100);

const toCashierProductResponse = (product) => {
	const value =
		typeof product?.toJSON === "function" ? product.toJSON() : product;
	const productImage = findPrimaryImage(value.images);
	const items = (value.items ?? []).map((item) => {
		const itemImage = findPrimaryImage(item.images) ?? productImage;
		const colorValue = item.attributeValues?.find((entry) =>
			/(?:color|colour|warna)/i.test(entry.attribute?.name ?? ""),
		);
		const specificationValue = item.attributeValues?.find(
			(entry) => !/(?:color|colour|warna)/i.test(entry.attribute?.name ?? ""),
		);
		return {
			id: item.id,
			productCode: item.productCode,
			price: item.price,
			colorId: colorValue?.categoryAttributeOptionId ?? "",
			specsId: specificationValue?.categoryAttributeOptionId ?? "",
			isActive: item.isActive,
			image: {
				alt: itemImage?.alt ?? `${value.name} ${item.name}`.trim(),
				url: itemImage?.imageUrl ?? EMPTY_IMAGE,
			},
			stock: item.inventory?.stock ?? 0,
		};
	});
	const minimumPriceByColor = new Map();
	for (const item of items) {
		const price = priceInCents(item.price);
		const minimum = minimumPriceByColor.get(item.colorId);
		if (minimum === undefined || price < minimum) {
			minimumPriceByColor.set(item.colorId, price);
		}
	}
	const itemsWithPriceDifference = items.map((item) => ({
		...item,
		priceDifference: (
			(priceInCents(item.price) - minimumPriceByColor.get(item.colorId)) /
			100
		).toFixed(2),
	}));
	const { attributes: categoryAttributes, ...category } = value.category ?? {};

	return {
		id: value.id,
		categoryId: value.categoryId,
		brandId: value.brandId,
		name: value.name,
		description: value.description,
		isActive: value.isActive,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		deletedAt: value.deletedAt,
		category,
		brand: value.brand,
		attributes: [...(categoryAttributes ?? [])]
			.toSorted((left, right) => left.sortOrder - right.sortOrder)
			.map((attribute) => ({
				title: attribute.name,
				...(attribute.value ? { desc: attribute.value } : {}),
				items: (attribute.options ?? []).map((option) => ({
					id: option.id,
					name: option.name,
					...(option.hex ? { hex: option.hex } : {}),
				})),
			})),
		items: itemsWithPriceDifference,
		image: {
			alt: productImage?.alt ?? value.name,
			url: productImage?.imageUrl ?? EMPTY_IMAGE,
		},
		stock: items.reduce((total, item) => total + Number(item.stock), 0),
	};
};

const sortCandidates = (candidates, sort) => {
	const products = [...candidates.values()];
	if (sort === "name_asc") {
		return products.toSorted((left, right) =>
			left.name.localeCompare(right.name),
		);
	}
	if (sort === "name_desc") {
		return products.toSorted((left, right) =>
			right.name.localeCompare(left.name),
		);
	}
	if (sort === "price_asc") {
		return products.toSorted(
			(left, right) => left.minimumPrice - right.minimumPrice,
		);
	}
	return products.toSorted(
		(left, right) => right.minimumPrice - left.minimumPrice,
	);
};

const productDetailIncludes = [
	{
		model: Categories,
		as: "category",
		attributes: ["id", "name", "isActive"],
		where: { isActive: true },
		required: true,
		include: [
			{
				model: CategoryAttributes,
				as: "attributes",
				attributes: [
					"id",
					"name",
					"value",
					"isRequired",
					"isVariant",
					"sortOrder",
				],
				required: false,
				separate: true,
				order: [["sortOrder", "ASC"]],
				include: [
					{
						model: CategoryAttributeOptions,
						as: "options",
						attributes: ["id", "name", "hex", "sortOrder"],
						required: false,
						separate: true,
						order: [["sortOrder", "ASC"]],
					},
				],
			},
		],
	},
	{
		model: Brands,
		as: "brand",
		attributes: ["id", "name", "isActive"],
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
		separate: true,
		order: [
			["isPrimary", "DESC"],
			["sortOrder", "ASC"],
		],
	},
	{
		model: ProductItems,
		as: "items",
		attributes: ["id", "productCode", "name", "price", "isActive"],
		where: { isActive: true },
		required: false,
		separate: true,
		order: [["price", "ASC"]],
		include: [
			{
				model: Inventories,
				as: "inventory",
				attributes: ["stock"],
				required: true,
			},
			{
				model: ProductImages,
				as: "images",
				attributes: ["imageUrl", "alt", "isPrimary", "sortOrder"],
				required: false,
				separate: true,
				order: [
					["isPrimary", "DESC"],
					["sortOrder", "ASC"],
				],
			},
			{
				model: ProductItemAttributeValues,
				as: "attributeValues",
				attributes: [
					"categoryAttributeId",
					"categoryAttributeOptionId",
					"value",
				],
				required: false,
				separate: true,
				include: [
					{
						model: CategoryAttributes,
						as: "attribute",
						attributes: ["id", "name", "isVariant", "sortOrder"],
						required: true,
					},
					{
						model: CategoryAttributeOptions,
						as: "option",
						attributes: ["id", "name", "hex"],
						required: true,
					},
				],
			},
		],
	},
];

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
		if (typeof sort !== "string" || !SORT_OPTIONS.has(sort)) {
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

		const matchingItems = await ProductItems.findAll({
			attributes: ["productId", "price"],
			where: itemWhere,
			include: [
				{
					model: Inventories,
					as: "inventory",
					attributes: [],
					where: inventoryWhere,
					required: true,
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
							attributes: [],
							where: { isActive: true },
							required: true,
						},
						{
							model: Brands,
							as: "brand",
							attributes: [],
							where: { isActive: true },
							required: true,
						},
					],
				},
			],
		});

		const candidates = new Map();
		for (const item of matchingItems) {
			const price = Number(item.price);
			const current = candidates.get(item.productId);
			if (current) {
				current.minimumPrice = Math.min(current.minimumPrice, price);
				current.maximumPrice = Math.max(current.maximumPrice, price);
			} else {
				candidates.set(item.productId, {
					id: item.productId,
					name: item.product?.name ?? "",
					minimumPrice: price,
					maximumPrice: price,
				});
			}
		}

		const orderedCandidates = sortCandidates(candidates, sort);
		const { page, limit, offset } = parsePagination(request.query);
		const pageCandidates = orderedCandidates.slice(offset, offset + limit);
		const pageIds = pageCandidates.map((candidate) => candidate.id);
		const foundProducts =
			pageIds.length === 0
				? []
				: await Products.findAll({
						where: { id: { [Op.in]: pageIds }, isActive: true },
						include: productDetailIncludes,
					});
		const productsById = new Map(
			foundProducts.map((product) => [product.id, product]),
		);
		const rows = pageIds
			.map((id) => productsById.get(id))
			.filter((product) => product !== undefined);

		return response.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Cashier products retrieved successfully",
			data: rows.map((product) => toCashierProductResponse(product)),
			meta: {
				pagination: createPaginationMetadata({
					count: orderedCandidates.length,
					page,
					limit,
				}),
			},
		});
	} catch (error) {
		return next(error);
	}
}
