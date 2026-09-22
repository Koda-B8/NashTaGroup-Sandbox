import { describe, expect, it, vi } from "vitest";

import { configureRealtimeServer } from "../../src/lib/realtime-server.js";

vi.mock("../../src/middleware/auth.js", () => ({
	authenticateToken: vi.fn(),
	getRequestToken: vi.fn(),
}));

describe("configureRealtimeServer", () => {
	it("joins authenticated sockets to role and user rooms", () => {
		const io = {
			engine: { use: vi.fn() },
			use: vi.fn(),
			on: vi.fn(),
		};
		const socket = {
			data: { user: { id: "user-1", role: "cashier" } },
			join: vi.fn(),
		};

		configureRealtimeServer(io);

		const connectionHandler = io.on.mock.calls.find(
			([event]) => event === "connection",
		)?.[1];
		connectionHandler(socket);

		expect(socket.join).toHaveBeenNthCalledWith(1, "role:cashier");
		expect(socket.join).toHaveBeenNthCalledWith(2, "user:user-1");
	});
});
