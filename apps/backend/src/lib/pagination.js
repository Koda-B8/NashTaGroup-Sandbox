const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_PAGE = 1_000_000;
const DEFAULT_MAX_LIMIT = 100;

class PaginationError extends Error {
	constructor(message) {
		super(message);
		this.statusCode = 400;
	}
}

const parsePositiveInteger = (value, field, fallback, maximum) => {
	if (value === undefined) return fallback;

	if (typeof value !== "string" || !/^\d+$/.test(value)) {
		throw new PaginationError(`${field} must be a positive integer`);
	}

	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
		throw new PaginationError(`${field} must be between 1 and ${maximum}`);
	}

	return parsed;
};

export function parsePagination(
	query = {},
	{
		defaultPage = DEFAULT_PAGE,
		defaultLimit = DEFAULT_LIMIT,
		maxPage = DEFAULT_MAX_PAGE,
		maxLimit = DEFAULT_MAX_LIMIT,
	} = {},
) {
	const page = parsePositiveInteger(query.page, "page", defaultPage, maxPage);
	const limit = parsePositiveInteger(
		query.limit,
		"limit",
		defaultLimit,
		maxLimit,
	);

	return { page, limit, offset: (page - 1) * limit };
}

export function createPaginationMetadata({ count, page, limit }) {
	const totalItems = Array.isArray(count) ? count.length : count;

	return {
		page,
		limit,
		total_items: totalItems,
		total_pages: Math.ceil(totalItems / limit),
	};
}

export async function paginate(model, query, findOptions = {}, config = {}) {
	const { page, limit, offset } = parsePagination(query, config);
	const { count, rows } = await model.findAndCountAll({
		...findOptions,
		limit,
		offset,
	});

	return {
		rows,
		pagination: createPaginationMetadata({
			count,
			page,
			limit,
		}),
	};
}
