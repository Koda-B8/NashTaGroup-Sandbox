import { describe, expect, it, vi } from "vitest";

import { emitInventoryUpdated } from "../../src/lib/inventory-realtime.js";

describe("emitInventoryUpdated", () => {
	it("notifies only the admin and cashier rooms with affected item IDs", () => {
		const emit = vi.fn();
		const io = { to: vi.fn(() => ({ emit })) };
		const app = { get: vi.fn(() => io) };

		emitInventoryUpdated(app, ["item-1", "item-2"], "checkout");

		expect(io.to).toHaveBeenCalledWith(["role:admin", "role:cashier"]);
		expect(emit).toHaveBeenCalledWith("inventory.updated", {
			product_item_ids: ["item-1", "item-2"],
			source: "checkout",
		});
	});

	it("does not let delivery failures escape", () => {
		const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
		const io = {
			to: vi.fn(() => ({
				emit: vi.fn(() => {
					throw new Error("down");
				}),
			})),
		};

		expect(() =>
			emitInventoryUpdated({ get: () => io }, ["item-1"], "manual_adjustment"),
		).not.toThrow();
		expect(warning).toHaveBeenCalledOnce();
		warning.mockRestore();
	});
});
