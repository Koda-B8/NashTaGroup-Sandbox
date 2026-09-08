import process from "node:process";

import app from "./app.js";
import db from "./models/index.cjs";

const { sequelize } = db;

const port = Number(process.env.BACKEND_PORT ?? 8080);

if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required.");
}

try {
	await sequelize.authenticate();
	app.listen(port, () => {
		console.info(`Backend listening on port ${port}.`);
	});
} catch (error) {
	console.error("Unable to start backend:", error);
	await sequelize.close();
	process.exitCode = 1;
}
