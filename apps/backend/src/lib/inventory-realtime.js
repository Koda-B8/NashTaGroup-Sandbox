const INVENTORY_ROOMS = ["role:admin", "role:cashier"];

export function emitInventoryUpdated(app, productItemIds, source) {
	const io = app?.get?.("io");
	if (!io || productItemIds.length === 0) return;

	try {
		io.to(INVENTORY_ROOMS).emit("inventory.updated", {
			product_item_ids: productItemIds,
			source,
		});
	} catch (error) {
		console.warn("Unable to emit inventory update:", error);
	}
}
