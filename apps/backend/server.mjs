import console from "node:console";
import process from "node:process";

import express from "express";
import { Sequelize } from "sequelize";

import configurations from "./config/config.cjs";

const environment = process.env.NODE_ENV ?? "development";
const configuration = configurations[environment];
if (!configuration) throw new Error(`Unknown NODE_ENV: ${environment}`);

const sequelize = new Sequelize(
	configuration.database,
	configuration.username,
	configuration.password,
	configuration,
);

const app = express();
app.disable("x-powered-by");
app.get("/health", async (_req, res) => {
	try {
		await sequelize.authenticate();
		return res.status(200).json({ success: true, database: "connected" });
	} catch {
		return res.status(503).json({ success: false, database: "unavailable" });
	}
});

try {
	await sequelize.authenticate();
	const port = Number(process.env.PORT ?? 3000);
	const server = app.listen(port, "0.0.0.0", () => {
		console.info(`Backend listening on port ${port}`);
	});
	let stopping = false;
	const shutdown = () => {
		if (stopping) return;
		stopping = true;
		server.close(async () => {
			try {
				await sequelize.close();
			} catch (error) {
				console.error("Unable to close database connection:", error);
				process.exitCode = 1;
			}
		});
		server.closeAllConnections();
	};
	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
} catch (error) {
	console.error("Unable to start backend:", error);
	await sequelize.close();
	process.exitCode = 1;
}
