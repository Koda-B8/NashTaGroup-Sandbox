import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import db from "../models/index.cjs";
import { createHttpError } from "../utils/http-error.js";
import { parseBoolean, parseSearch } from "../utils/query.js";
import { isUuid, normalizeText } from "../utils/validation.js";

const {
	Categories,
	CategoryAttributeOptions,
	CategoryAttributes,
	ProductItemAttributeValues,
	sequelize,
} = db;

const attributeInclude = {
	model: CategoryAttributes,
	as: "attributes",
	attributes: ["id", "name", "value", "isRequired", "isVariant", "sortOrder"],
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
};

const parseOptions = (value, attributeIndex) => {
	if (value === undefined) return;
	if (!Array.isArray(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			`attributes[${attributeIndex}].options must be an array`,
		);
	}
	const names = new Set();
	return value.map((option, optionIndex) => {
		const name = normalizeText(option?.name);
		if (!name) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${attributeIndex}].options[${optionIndex}].name is required`,
			);
		}
		const normalizedName = name.toLocaleLowerCase("id-ID");
		if (names.has(normalizedName)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`Duplicate attribute option: ${name}`,
			);
		}
		names.add(normalizedName);

		if (option?.id !== undefined && !isUuid(option.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${attributeIndex}].options[${optionIndex}].id must be a valid UUID`,
			);
		}
		if (
			option?.hex !== undefined &&
			option.hex !== null &&
			(typeof option.hex !== "string" || !/^#[\dA-Fa-f]{6}$/.test(option.hex))
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${attributeIndex}].options[${optionIndex}].hex must use #RRGGBB format`,
			);
		}
		return {
			...(option?.id ? { id: option.id } : {}),
			name,
			// oxlint-disable-next-line unicorn/no-null -- Missing color metadata is stored as SQL NULL.
			hex: option?.hex?.toUpperCase() ?? null,
			sortOrder: optionIndex,
		};
	});
};

const parseAttributes = (value) => {
	if (value === undefined) return;
	if (!Array.isArray(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"attributes must be an array",
		);
	}

	const names = new Set();
	return value.map((attribute, index) => {
		const name = normalizeText(attribute?.name);
		if (!name) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}].name is required`,
			);
		}
		if (name.length > 100) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}].name must not exceed 100 characters`,
			);
		}
		const normalizedName = name.toLocaleLowerCase("id-ID");
		if (names.has(normalizedName)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`Duplicate category attribute: ${name}`,
			);
		}
		names.add(normalizedName);

		if (
			attribute?.value !== undefined &&
			attribute.value !== null &&
			typeof attribute.value !== "string"
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}].value must be a string or null`,
			);
		}
		const attributeValue = normalizeText(attribute?.value);
		if (attributeValue.length > 255) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}].value must not exceed 255 characters`,
			);
		}

		for (const field of ["isRequired", "isVariant"]) {
			if (
				attribute?.[field] !== undefined &&
				typeof attribute[field] !== "boolean"
			) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					`attributes[${index}].${field} must be a boolean`,
				);
			}
		}

		return {
			...(attribute?.id ? { id: attribute.id } : {}),
			name,
			// oxlint-disable-next-line unicorn/no-null -- Empty optional values are stored as SQL NULL.
			value: attributeValue || null,
			isRequired: attribute?.isRequired ?? false,
			isVariant: attribute?.isVariant ?? true,
			sortOrder: index,
			options: parseOptions(attribute?.options, index),
		};
	});
};

const createAttributeOptions = async (attribute, transaction) => {
	if (!attribute.options?.length) return;
	await CategoryAttributeOptions.bulkCreate(
		attribute.options.map((option) => ({
			...option,
			categoryAttributeId: attribute.id,
		})),
		{ transaction },
	);
};

const syncAttributeOptions = async (attributeId, options, transaction) => {
	if (options === undefined) return;
	const existing = await CategoryAttributeOptions.findAll({
		where: { categoryAttributeId: attributeId },
		transaction,
	});
	const existingById = new Map(existing.map((option) => [option.id, option]));
	const retainedIds = new Set();
	for (const option of options) {
		if (option.id) {
			const current = existingById.get(option.id);
			if (!current) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					`Option ${option.id} does not belong to attribute ${attributeId}`,
				);
			}
			retainedIds.add(option.id);
			await current.update(option, { transaction });
		} else {
			await CategoryAttributeOptions.create(
				{ ...option, categoryAttributeId: attributeId },
				{ transaction },
			);
		}
	}
	const removed = existing.filter((option) => !retainedIds.has(option.id));
	if (removed.length === 0) return;
	const removedIds = removed.map((option) => option.id);
	const usedCount = await ProductItemAttributeValues.count({
		where: { categoryAttributeOptionId: { [Op.in]: removedIds } },
		transaction,
	});
	if (usedCount > 0) {
		throw createHttpError(
			constants.HTTP_STATUS_CONFLICT,
			"Attribute options already used by product variants cannot be removed",
		);
	}
	await CategoryAttributeOptions.destroy({
		where: { id: { [Op.in]: removedIds } },
		transaction,
	});
};

export async function getCategories(req, res, next) {
	try {
		const search = parseSearch(req.query.search);
		const isActive = parseBoolean(req.query.isActive);

		if (req.query.isActive !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be true or false",
			);
		}

		const where = {};

		if (search) {
			Object.assign(where, {
				name: {
					[Op.iLike]: `%${search}%`,
				},
			});
		}

		if (isActive !== undefined) {
			Object.assign(where, { isActive });
		}

		const categories = await Categories.findAll({
			where,
			include: [attributeInclude],
			order: [["name", "ASC"]],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Categories retrieved successfully",
			data: categories,
		});
	} catch (error) {
		return next(error);
	}
}

export async function getCategoryById(req, res, next) {
	try {
		const category = await Categories.findByPk(req.params.id, {
			include: [attributeInclude],
		});

		if (!category) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Category not found",
			);
		}

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Category retrieved successfully",
			data: category,
		});
	} catch (error) {
		return next(error);
	}
}

export async function createCategory(req, res, next) {
	try {
		const name = normalizeText(req.body?.name);
		const attributes = parseAttributes(req.body?.attributes);

		if (!name) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"Category name is required",
			);
		}

		let category;
		if (attributes === undefined) {
			category = await Categories.create({ name });
		} else {
			category = await sequelize.transaction(async (transaction) => {
				const created = await Categories.create({ name }, { transaction });
				if (attributes.length > 0) {
					const createdAttributes = await CategoryAttributes.bulkCreate(
						attributes.map((attribute) => ({
							...Object.fromEntries(
								Object.entries(attribute).filter(([key]) => key !== "options"),
							),
							categoryId: created.id,
						})),
						{ transaction },
					);
					await Promise.all(
						createdAttributes.map((createdAttribute, index) =>
							createAttributeOptions(
								{ ...attributes[index], id: createdAttribute.id },
								transaction,
							),
						),
					);
				}
				return created;
			});
			category = await Categories.findByPk(category.id, {
				include: [attributeInclude],
			});
		}

		return res.status(constants.HTTP_STATUS_CREATED).json({
			success: true,
			message: "Category created successfully",
			data: category,
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Category name already exists",
				),
			);
		}

		return next(error);
	}
}

export async function updateCategory(req, res, next) {
	try {
		const category = await Categories.findByPk(req.params.id);

		if (!category) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Category not found",
			);
		}

		const updates = {};
		const attributes = parseAttributes(req.body?.attributes);

		if (Object.hasOwn(req.body ?? {}, "name")) {
			const name = normalizeText(req.body.name);

			if (!name) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"Category name cannot be empty",
				);
			}

			Object.assign(updates, { name });
		}

		if (Object.hasOwn(req.body ?? {}, "isActive")) {
			if (typeof req.body.isActive !== "boolean") {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					"isActive must be a boolean",
				);
			}

			Object.assign(updates, { isActive: req.body.isActive });
		}

		if (Object.keys(updates).length === 0 && attributes === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"No valid field provided for update",
			);
		}

		if (attributes === undefined) {
			await category.update(updates);
			return res.status(constants.HTTP_STATUS_OK).json({
				success: true,
				message: "Category updated successfully",
				data: category,
			});
		}

		await sequelize.transaction(async (transaction) => {
			if (Object.keys(updates).length > 0) {
				await category.update(updates, { transaction });
			}

			{
				const existing = await CategoryAttributes.findAll({
					where: { categoryId: category.id },
					transaction,
				});
				const existingById = new Map(existing.map((item) => [item.id, item]));
				const retainedIds = new Set();

				for (const attribute of attributes) {
					const { options, ...attributeData } = attribute;
					if (attribute.id) {
						const current = existingById.get(attribute.id);
						if (!current) {
							throw createHttpError(
								constants.HTTP_STATUS_BAD_REQUEST,
								`Attribute ${attribute.id} does not belong to this category`,
							);
						}
						retainedIds.add(attribute.id);
						await current.update(attributeData, { transaction });
						await syncAttributeOptions(attribute.id, options, transaction);
					} else {
						const createdAttribute = await CategoryAttributes.create(
							{ ...attributeData, categoryId: category.id },
							{ transaction },
						);
						await createAttributeOptions(
							{ ...attribute, id: createdAttribute.id },
							transaction,
						);
					}
				}

				const removed = existing.filter((item) => !retainedIds.has(item.id));
				if (removed.length > 0) {
					const usedCount = await ProductItemAttributeValues.count({
						where: {
							categoryAttributeId: { [Op.in]: removed.map((item) => item.id) },
						},
						transaction,
					});
					if (usedCount > 0) {
						throw createHttpError(
							constants.HTTP_STATUS_CONFLICT,
							"Category attributes already used by product variants cannot be removed",
						);
					}
					await CategoryAttributes.destroy({
						where: { id: { [Op.in]: removed.map((item) => item.id) } },
						transaction,
					});
				}
			}
		});

		const updatedCategory = await Categories.findByPk(category.id, {
			include: [attributeInclude],
		});

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Category updated successfully",
			data: updatedCategory,
		});
	} catch (error) {
		if (error instanceof UniqueConstraintError) {
			return next(
				createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					"Category name already exists",
				),
			);
		}

		return next(error);
	}
}

export async function deleteCategory(req, res, next) {
	try {
		const category = await Categories.findByPk(req.params.id);

		if (!category) {
			throw createHttpError(
				constants.HTTP_STATUS_NOT_FOUND,
				"Category not found",
			);
		}

		await category.destroy();

		return res.status(constants.HTTP_STATUS_OK).json({
			success: true,
			message: "Category deleted successfully",
		});
	} catch (error) {
		return next(error);
	}
}
