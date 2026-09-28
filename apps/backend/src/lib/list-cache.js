import { createHash } from "node:crypto";

import { runRedis } from "./redis-client.js";

const CACHE_TTL_SECONDS = 30;
const versionKey = (scope) => `nashtagroup:${scope}:list:version`;

export async function listCacheKey(scope, filters) {
	const version = await runRedis((client) => client.get(versionKey(scope)));
	if (!version.ok) return;
	const hash = createHash("sha256")
		.update(JSON.stringify(filters))
		.digest("hex");
	return `nashtagroup:${scope}:list:v${version.value ?? "0"}:${hash}`;
}

export async function readListCache(key) {
	if (!key) return;
	const result = await runRedis((client) => client.get(key));
	if (!result.ok || !result.value) return;
	try {
		return JSON.parse(result.value);
	} catch {
		return;
	}
}

export async function writeListCache(key, body) {
	if (!key) return;
	await runRedis((client) =>
		client.set(key, JSON.stringify(body), { EX: CACHE_TTL_SECONDS }),
	);
}

export async function invalidateListCache(scope) {
	await runRedis((client) => client.incr(versionKey(scope)));
}
