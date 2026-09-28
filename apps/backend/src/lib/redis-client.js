import { createClient } from "redis";

const RETRY_DELAY_MS = 30_000;

let client;
let connecting;
let retryAfter = 0;

// redis@6 throws ClientClosedError when destroy() is called on a client whose
// socket is already closed (e.g. right after a Redis restart, since
// reconnectStrategy is false). Teardown must never throw, otherwise cleanup
// fails and the stale client is never cleared, permanently breaking the cache.
function destroyQuietly(target) {
	if (!target) return;
	try {
		target.destroy();
	} catch {
		// Client already closed; nothing left to clean up.
	}
}

async function getClient() {
	if (!process.env.REDIS_URL || Date.now() < retryAfter) return;
	if (client?.isReady) return client;
	if (!connecting) {
		destroyQuietly(client);
		client = undefined;
		const nextClient = createClient({
			url: process.env.REDIS_URL,
			socket: {
				connectTimeout: 300,
				reconnectStrategy: false,
			},
		});
		nextClient.on("error", () => {});
		connecting = nextClient
			.connect()
			.then(() => {
				client = nextClient;
				return client;
			})
			.catch(() => {
				destroyQuietly(nextClient);
				retryAfter = Date.now() + RETRY_DELAY_MS;
				return;
			})
			.finally(() => {
				connecting = undefined;
			});
	}
	return connecting;
}

export async function runRedis(operation) {
	try {
		const connected = await getClient();
		if (!connected) return { ok: false };
		return { ok: true, value: await operation(connected) };
	} catch {
		destroyQuietly(client);
		client = undefined;
		retryAfter = Date.now() + RETRY_DELAY_MS;
		return { ok: false };
	}
}
