class SortingError extends Error {
	constructor(message) {
		super(message);
		this.statusCode = 400;
	}
}

export function parseSorting(query = {}, { defaultSort, options, message }) {
	const sort = query.sort ?? defaultSort;

	if (typeof sort !== "string" || !options.has(sort)) {
		throw new SortingError(message);
	}

	return { sort, order: options.get(sort) };
}
