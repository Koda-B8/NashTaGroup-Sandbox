import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import process from "node:process";

import { io } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const isEnabled = process.env.RUN_REALTIME_INTEGRATION === "1";
const backendDirectory = new URL("../..", import.meta.url);
let backend;
let baseUrl;

const delay = (milliseconds) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

const getAvailablePort = async () => {
	const server = createServer();
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	await new Promise((resolve) => server.close(resolve));

	if (!address || typeof address === "string") {
		throw new Error("Unable to allocate a local port");
	}

	return address.port;
};

const waitForHealth = async () => {
	for (let attempt = 0; attempt < 50; attempt += 1) {
		try {
			const response = await fetch(`${baseUrl}/health`);
			if (response.ok) return;
		} catch {}

		await delay(100);
	}

	throw new Error("Backend did not become healthy");
};

const connect = (options = {}) => {
	const socket = io(baseUrl, {
		reconnection: false,
		transports: ["websocket"],
		...options,
	});

	return {
		socket,
		connected: once(socket, "connect"),
		failed: once(socket, "connect_error"),
	};
};

describe.skipIf(!isEnabled)("realtime Socket.IO integration", () => {
	beforeAll(async () => {
		process.loadEnvFile(new URL("../../.env", import.meta.url));
		if (!process.env.SEED_ADMIN_PASSWORD) {
			throw new Error(
				"SEED_ADMIN_PASSWORD is required for this integration test",
			);
		}

		const port = await getAvailablePort();
		baseUrl = `http://127.0.0.1:${port}`;
		backend = spawn(process.execPath, ["--env-file=.env", "src/server.js"], {
			cwd: backendDirectory,
			env: { ...process.env, BACKEND_PORT: String(port) },
			stdio: "pipe",
		});
		await waitForHealth();
	});

	afterAll(async () => {
		if (backend?.exitCode === null) {
			backend.kill("SIGTERM");
			await once(backend, "exit");
		}
	});

	it("authenticates sockets and disconnects them on logout", async () => {
		const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "admin",
				password: process.env.SEED_ADMIN_PASSWORD,
			}),
		});
		expect(loginResponse.status).toBe(200);
		const loginBody = await loginResponse.json();
		const cookie = loginResponse.headers
			.getSetCookie()
			.map((value) => value.split(";", 1)[0])
			.join("; ");

		expect(cookie).toContain("auth_token=");
		expect(loginBody.data.csrfToken).toEqual(expect.any(String));

		const authorized = connect({ extraHeaders: { Cookie: cookie } });
		await authorized.connected;

		const unauthorized = connect();
		const [error] = await unauthorized.failed;
		expect(error.message).toBe("Unauthorized");
		unauthorized.socket.disconnect();

		const disconnected = once(authorized.socket, "disconnect");
		const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
			method: "POST",
			headers: {
				"Cookie": cookie,
				"X-CSRF-Token": loginBody.data.csrfToken,
			},
		});

		expect(logoutResponse.status).toBe(200);
		await disconnected;
	});
});
