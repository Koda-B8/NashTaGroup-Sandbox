const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
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

export function createPageMetadata({ count, rowCount, page, limit }) {
	const total = Array.isArray(count) ? count.length : count;
	const totalPages = Math.ceil(total / limit);

	return {
		total,
		count: rowCount,
		current: page,
		next: page < totalPages ? page + 1 : undefined,
		prev: page > 1 ? page - 1 : undefined,
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
		page: createPageMetadata({
			count,
			rowCount: rows.length,
			page,
			limit,
		}),
	};
}
