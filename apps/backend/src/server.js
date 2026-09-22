import { createServer } from "node:http";
import process from "node:process";

import { Server } from "socket.io";

import app, { allowedOrigins } from "./app.js";
import { configureRealtimeServer } from "./lib/realtime-server.js";
import db from "./models/index.cjs";

const { sequelize } = db;

const port = Number(process.env.BACKEND_PORT ?? 8080);
if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required.");
}

try {
	await sequelize.authenticate();
	const httpServer = createServer(app);
	const io = new Server(httpServer, {
		cors: { origin: allowedOrigins, credentials: true },
	});

	configureRealtimeServer(io);
	app.set("io", io);

	httpServer.listen(port, () => {
		console.info(`Backend listening on port ${port}.`);
	});
} catch (error) {
	console.error("Unable to start backend:", error);
	await sequelize.close();
	process.exitCode = 1;
}
