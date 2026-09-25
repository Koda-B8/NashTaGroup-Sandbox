// oxlint-disable unicorn/no-null
import { constants } from "node:http2";

import { Op, UniqueConstraintError } from "sequelize";

import {
	listCacheKey,
	readListCache,
	writeListCache,
} from "../lib/list-cache.js";
import { parseSorting } from "../lib/sorting.js";
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
const CATEGORY_SORTS = new Map([
	["name_asc", [["name", "ASC"]]],
	["name_desc", [["name", "DESC"]]],
	["created_at_asc", [["createdAt", "ASC"]]],
	["created_at_desc", [["createdAt", "DESC"]]],
]);

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

const parseOptions = (value, attributeIndex, partial = false) => {
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
		if (!name && (!partial || !option?.id || option?.name !== undefined)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${attributeIndex}].options[${optionIndex}].name is required`,
			);
		}
		const normalizedName = name.toLocaleLowerCase("id-ID");
		if (name && names.has(normalizedName)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`Duplicate attribute option: ${name}`,
			);
		}
		if (name) names.add(normalizedName);

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
			...(name ? { name } : {}),
			// oxlint-disable-next-line unicorn/no-null -- Missing color metadata is stored as SQL NULL.
			...(!partial || option?.hex !== undefined
				? { hex: option?.hex?.toUpperCase() ?? null }
				: {}),
			...(partial ? {} : { sortOrder: optionIndex }),
		};
	});
};

const parseAttributes = (value, partial = false) => {
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
		if (
			!name &&
			(!partial || !attribute?.id || attribute?.name !== undefined)
		) {
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
		if (name && names.has(normalizedName)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`Duplicate category attribute: ${name}`,
			);
		}
		if (name) names.add(normalizedName);

		if (attribute?.id !== undefined && !isUuid(attribute.id)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}].id must be a valid UUID`,
			);
		}

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
			...(name ? { name } : {}),
			// oxlint-disable-next-line unicorn/no-null -- Empty optional values are stored as SQL NULL.
			...(!partial || attribute?.value !== undefined
				? { value: attributeValue || null }
				: {}),
			...(!partial || attribute?.isRequired !== undefined
				? { isRequired: attribute?.isRequired ?? false }
				: {}),
			...(!partial || attribute?.isVariant !== undefined
				? { isVariant: attribute?.isVariant ?? true }
				: {}),
			...(partial ? {} : { sortOrder: index }),
			options: parseOptions(attribute?.options, index, partial),
		};
	});
};

const createAttributeOptions = async (attribute, transaction) => {
	if (!attribute.options?.length) return;
	await CategoryAttributeOptions.bulkCreate(
		attribute.options.map((option, index) => ({
			...option,
			categoryAttributeId: attribute.id,
			sortOrder: option.sortOrder ?? index,
		})),
		{ transaction },
	);
};

const getChangedFields = (current, fields) =>
	Object.fromEntries(
		Object.entries(fields).filter(([field, value]) => current[field] !== value),
	);

const syncAttributeOptions = async (attributeId, options, transaction) => {
	if (options === undefined) return;
	const existing = await CategoryAttributeOptions.findAll({
		where: { categoryAttributeId: attributeId },
		transaction,
	});
	const existingById = new Map(existing.map((option) => [option.id, option]));
	const namesByKey = new Map(
		existing.map((option) => [
			option.name.toLocaleLowerCase("id-ID"),
			option.id,
		]),
	);
	const retainedIds = new Set();
	for (const [index, option] of options.entries()) {
		if (option.name) {
			const owner = namesByKey.get(option.name.toLocaleLowerCase("id-ID"));
			if (owner && owner !== option.id) {
				throw createHttpError(
					constants.HTTP_STATUS_CONFLICT,
					`Attribute option ${option.name} already exists`,
				);
			}
			if (option.id) {
				const previousName = existingById.get(option.id)?.name;
				if (previousName)
					namesByKey.delete(previousName.toLocaleLowerCase("id-ID"));
			}
			namesByKey.set(option.name.toLocaleLowerCase("id-ID"), option.id ?? true);
		}
		if (option.id) {
			const current = existingById.get(option.id);
			if (!current) {
				throw createHttpError(
					constants.HTTP_STATUS_BAD_REQUEST,
					`Option ${option.id} does not belong to attribute ${attributeId}`,
				);
			}
			retainedIds.add(option.id);
			const { id: _id, ...fields } = option;
			const changes = { ...fields, sortOrder: index };
			const changedFields = getChangedFields(current, changes);
			if (Object.keys(changedFields).length > 0) {
				await current.update(changedFields, { transaction });
			}
		} else {
			await CategoryAttributeOptions.create(
				{
					...option,
					categoryAttributeId: attributeId,
					sortOrder: index,
				},
				{ transaction },
			);
		}
	}
	const removedIds = existing
		.filter((option) => !retainedIds.has(option.id))
		.map((option) => option.id);
	if (removedIds.length === 0) return;
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
		const { sort, order } = parseSorting(req.query, {
			defaultSort: "name_asc",
			options: CATEGORY_SORTS,
			message:
				"sort must be name_asc, name_desc, created_at_asc, or created_at_desc",
		});

		if (req.query.isActive !== undefined && isActive === undefined) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				"isActive must be true or false",
			);
		}
		const cacheKey = await listCacheKey("categories", {
			search,
			isActive,
			sort,
		});
		const cached = await readListCache(cacheKey);
		if (cached) return res.status(constants.HTTP_STATUS_OK).json(cached);

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
			order,
		});

		const body = {
			success: true,
			message: "Categories retrieved successfully",
			data: categories,
		};
		await writeListCache(cacheKey, body);
		return res.status(constants.HTTP_STATUS_OK).json(body);
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
		const attributes = parseAttributes(req.body?.attributes, true);

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
			const changedFields = getChangedFields(category, updates);
			if (Object.keys(changedFields).length > 0) {
				await category.update(changedFields);
			}
			return res.status(constants.HTTP_STATUS_OK).json({
				success: true,
				message: "Category updated successfully",
				data: category,
			});
		}

		await sequelize.transaction(async (transaction) => {
			const changedFields = getChangedFields(category, updates);
			if (Object.keys(changedFields).length > 0) {
				await category.update(changedFields, { transaction });
			}

			{
				const existing = await CategoryAttributes.findAll({
					where: { categoryId: category.id },
					transaction,
				});
				const existingById = new Map(existing.map((item) => [item.id, item]));
				const namesByKey = new Map(
					existing.map((item) => [
						item.name.toLocaleLowerCase("id-ID"),
						item.id,
					]),
				);
				const retainedIds = new Set();

				for (const [index, attribute] of attributes.entries()) {
					const { options, ...attributeData } = attribute;
					if (attribute.name) {
						const owner = namesByKey.get(
							attribute.name.toLocaleLowerCase("id-ID"),
						);
						if (owner && owner !== attribute.id) {
							throw createHttpError(
								constants.HTTP_STATUS_CONFLICT,
								`Category attribute ${attribute.name} already exists`,
							);
						}
						if (attribute.id) {
							const previousName = existingById.get(attribute.id)?.name;
							if (previousName) {
								namesByKey.delete(previousName.toLocaleLowerCase("id-ID"));
							}
						}
						namesByKey.set(
							attribute.name.toLocaleLowerCase("id-ID"),
							attribute.id ?? true,
						);
					}
					if (attribute.id) {
						const current = existingById.get(attribute.id);
						if (!current) {
							throw createHttpError(
								constants.HTTP_STATUS_BAD_REQUEST,
								`Attribute ${attribute.id} does not belong to this category`,
							);
						}
						retainedIds.add(attribute.id);
						const { id: _id, ...fields } = attributeData;
						const changes = { ...fields, sortOrder: index };
						const changedFields = getChangedFields(current, changes);
						if (Object.keys(changedFields).length > 0) {
							await current.update(changedFields, { transaction });
						}
						await syncAttributeOptions(attribute.id, options, transaction);
					} else {
						const createdAttribute = await CategoryAttributes.create(
							{
								...attributeData,
								categoryId: category.id,
								sortOrder: index,
							},
							{ transaction },
						);
						await createAttributeOptions(
							{ ...attribute, id: createdAttribute.id },
							transaction,
						);
					}
				}
				const removedIds = existing
					.filter((item) => !retainedIds.has(item.id))
					.map((item) => item.id);
				if (removedIds.length > 0) {
					const usedCount = await ProductItemAttributeValues.count({
						where: { categoryAttributeId: { [Op.in]: removedIds } },
						transaction,
					});
					if (usedCount > 0) {
						throw createHttpError(
							constants.HTTP_STATUS_CONFLICT,
							"Category attributes already used by product variants cannot be removed",
						);
					}
					await CategoryAttributes.destroy({
						where: { id: { [Op.in]: removedIds } },
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
