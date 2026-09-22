import { createClient } from "redis";

const RETRY_DELAY_MS = 30_000;

let client;
let connecting;
let retryAfter = 0;

async function getClient() {
	if (!process.env.REDIS_URL || Date.now() < retryAfter) return;
	if (client?.isReady) return client;
	if (!connecting) {
		client?.destroy();
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
				nextClient.destroy();
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
		client?.destroy();
		client = undefined;
		retryAfter = Date.now() + RETRY_DELAY_MS;
		return { ok: false };
	}
}
