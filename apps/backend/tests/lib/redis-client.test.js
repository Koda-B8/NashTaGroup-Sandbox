import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn();

vi.mock("redis", () => ({
	createClient: (...args) => createClient(...args),
}));

// redis@6 throws ClientClosedError when destroy() is called on a client whose
// socket is already closed. Reproduce that here: destroying a closed client
// throws, exactly like the real library does after a Redis restart.
function makeClient({ isReady = true, connectFails = false } = {}) {
	const client = {
		isReady,
		on: vi.fn(),
		connect: vi.fn(async () => {
			if (connectFails) throw new Error("connect failed");
		}),
		destroy: vi.fn(() => {
			if (!client.isReady) throw new Error("ClientClosedError");
		}),
	};
	return client;
}

beforeEach(() => {
	vi.resetModules();
	createClient.mockReset();
	process.env.REDIS_URL = "redis://localhost:6379";
});

describe("runRedis resilience", () => {
	it("clears the stale client and recovers after Redis restarts", async () => {
		vi.useFakeTimers();
		try {
			const { runRedis } = await import("../../src/lib/redis-client.js");

			// 1. Healthy connection.
			const first = makeClient();
			createClient.mockReturnValueOnce(first);
			await expect(runRedis(async () => "ok")).resolves.toEqual({
				ok: true,
				value: "ok",
			});

			// 2. Redis restarts: the socket closes, so destroy() now throws.
			first.isReady = false;
			const down = makeClient({ isReady: false, connectFails: true });
			createClient.mockReturnValueOnce(down);

			// Must resolve to { ok: false } instead of rejecting with
			// ClientClosedError thrown while tearing down the stale client.
			await expect(runRedis(async () => "never")).resolves.toEqual({
				ok: false,
			});

			// 3. After the retry window, Redis is back and caching resumes.
			await vi.advanceTimersByTimeAsync(30_001);
			const recovered = makeClient();
			createClient.mockReturnValueOnce(recovered);
			await expect(runRedis(async () => "fresh")).resolves.toEqual({
				ok: true,
				value: "fresh",
			});
		} finally {
			vi.useRealTimers();
		}
	});

	it("does not reject when a command fails on a live client", async () => {
		const { runRedis } = await import("../../src/lib/redis-client.js");

		const live = makeClient();
		createClient.mockReturnValueOnce(live);

		// The command itself throws (e.g. the socket dropped mid-command).
		await expect(
			runRedis(async () => {
				throw new Error("socket closed");
			}),
		).resolves.toEqual({ ok: false });
	});
});
