import {
	type InventoryMovement,
	listInventoryMovements,
	type MovementType,
} from "./api";

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

async function fetchItemMovements(opts: {
	productItemId: string;
	type?: MovementType;
	from?: string;
	to?: string;
}): Promise<InventoryMovement[]> {
	const all: InventoryMovement[] = [];
	for (let page = 1; page <= MAX_PAGES; page++) {
		const { data, meta } = await listInventoryMovements({
			product_item_id: opts.productItemId,
			...(opts.type ? { type: opts.type } : {}),
			...(opts.from ? { from: opts.from } : {}),
			...(opts.to ? { to: opts.to } : {}),
			page,
			limit: PAGE_LIMIT,
		});
		all.push(...data);
		const totalPages = meta?.pagination.total_pages ?? 1;
		if (data.length === 0 || page >= totalPages) break;
	}
	return all;
}

/**
 * Load every movement for a set of product items and merge them, newest first.
 * Used where the API can only filter one `product_item_id` at a time but the
 * caller needs a product-wide view (e.g. a product master report).
 */
export async function fetchAllInventoryMovements(opts: {
	productItemIds: string[];
	type?: MovementType;
	from?: string;
	to?: string;
}): Promise<InventoryMovement[]> {
	const ids = opts.productItemIds.filter(Boolean);
	if (ids.length === 0) return [];
	const perItem = await Promise.all(
		ids.map((productItemId) =>
			fetchItemMovements({
				productItemId,
				type: opts.type,
				from: opts.from,
				to: opts.to,
			}),
		),
	);
	return perItem.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
