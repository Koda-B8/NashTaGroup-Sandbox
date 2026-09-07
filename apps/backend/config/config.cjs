const path = require("node:path");

try {
	process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch (error) {
	const errorCode =
		error && typeof error === "object" && "code" in error
			? error.code
			: undefined;

	if (errorCode !== "ENOENT") throw error;
}

const parsePort = (value, fallback) => {
	const parsed = Math.trunc(Number(value));
	return Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535
		? parsed
		: fallback;
};

const shared = {
	dialect: "postgres",
	host: process.env.DB_HOST ?? "127.0.0.1",
	port: parsePort(process.env.DB_PORT, 5432),
	username: process.env.DB_USER ?? "postgres",
	password: process.env.DB_PASSWORD ?? "postgres",
	logging: false,
	migrationStorage: "sequelize",
	migrationStorageTableName: "SequelizeMeta",
	seederStorage: "sequelize",
	seederStorageTableName: "SequelizeData",
};

module.exports = {
	development: {
		...shared,
		database: process.env.DB_NAME ?? "nashtagroup_pos",
	},
	test: {
		...shared,
		database: process.env.DB_NAME ?? "nashtagroup_pos_test",
	},
	production: {
		...shared,
		database: process.env.DB_NAME ?? "nashtagroup_pos",
		logging: false,
		dialectOptions:
			process.env.DB_SSL === "true"
				? { ssl: { require: true, rejectUnauthorized: false } }
				: undefined,
	},
};
