// oxlint-disable unicorn/no-null -- A missing signature is persisted as SQL NULL so the partial unique index ignores non-variant items.
import { constants } from "node:http2";

import { createHttpError } from "./http-error.js";
import { isUuid, normalizeText } from "./validation.js";

export const normalizeProductCode = (value) => {
	if (typeof value !== "string") return "";
	return value.trim().toUpperCase();
};

export const isValidProductCode = (value) =>
	/^[A-Z0-9][A-Z0-9-]{0,49}$/.test(value);

export const parsePrice = (value) => {
	const rawValue = String(value ?? "").trim();
	if (!/^\d{1,13}(\.\d{1,2})?$/.test(rawValue)) return;
	const price = Number(rawValue);
	if (!Number.isFinite(price) || price <= 0) return;
	return rawValue;
};

export const parseStock = (value) => {
	if (!Number.isInteger(value) || value < 0) return;
	return value;
};

export const parseAttributeValues = (value, definitions = []) => {
	if (value === undefined) {
		const missing = definitions.filter((attribute) => attribute.isRequired);
		if (missing.length > 0) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`Required attributes are missing: ${missing.map((item) => item.name).join(", ")}`,
			);
		}
		return [];
	}
	if (!Array.isArray(value)) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			"attributes must be an array",
		);
	}

	const definitionsById = new Map(
		definitions.map((attribute) => [attribute.id, attribute]),
	);
	const seen = new Set();
	const parsed = value.map((entry, index) => {
		if (
			!isUuid(entry?.attributeId) ||
			!definitionsById.has(entry.attributeId)
		) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}].attributeId is not valid for the product category`,
			);
		}
		if (seen.has(entry.attributeId)) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`Duplicate attribute value: ${definitionsById.get(entry.attributeId).name}`,
			);
		}
		seen.add(entry.attributeId);
		const definition = definitionsById.get(entry.attributeId);
		const normalizedValue = normalizeText(entry.value);
		const option = entry?.optionId
			? definition.options?.find((candidate) => candidate.id === entry.optionId)
			: definition.options?.find(
					(candidate) =>
						candidate.name.toLocaleLowerCase("id-ID") ===
						normalizedValue.toLocaleLowerCase("id-ID"),
				);
		if (!option) {
			throw createHttpError(
				constants.HTTP_STATUS_BAD_REQUEST,
				`attributes[${index}] must reference a valid option for ${definition.name}`,
			);
		}
		return {
			categoryAttributeId: entry.attributeId,
			categoryAttributeOptionId: option.id,
			value: option.name,
			isVariant: definition.isVariant,
			sortOrder: definition.sortOrder,
		};
	});

	const missing = definitions.filter(
		(attribute) => attribute.isRequired && !seen.has(attribute.id),
	);
	if (missing.length > 0) {
		throw createHttpError(
			constants.HTTP_STATUS_BAD_REQUEST,
			`Required attributes are missing: ${missing.map((item) => item.name).join(", ")}`,
		);
	}
	return parsed;
};

export const getVariantIdentity = (attributes) => {
	const variants = attributes
		.filter((attribute) => attribute.isVariant)
		.toSorted(
			(left, right) =>
				(left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
				left.categoryAttributeId.localeCompare(right.categoryAttributeId),
		);

	return {
		name: variants.map((attribute) => attribute.value).join(" "),
		signature:
			variants.length > 0
				? variants
						.toSorted((left, right) =>
							left.categoryAttributeId.localeCompare(right.categoryAttributeId),
						)
						.map(
							(attribute) =>
								`${attribute.categoryAttributeId}:${attribute.categoryAttributeOptionId}`,
						)
						.join("|")
				: null,
	};
};

export const toStoredAttributeValues = (attributes, productItemId) =>
	attributes.map(
		({ categoryAttributeId, categoryAttributeOptionId, value }) => ({
			productItemId,
			categoryAttributeId,
			categoryAttributeOptionId,
			value,
		}),
	);
