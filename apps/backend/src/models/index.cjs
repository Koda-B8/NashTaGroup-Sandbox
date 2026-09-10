const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { DataTypes, Sequelize } = require("sequelize");
const configurations = require("../../config/config.cjs");

const basename = path.basename(__filename);
const environment = process.env.NODE_ENV ?? "development";
const configuration = configurations[environment];
const db = {};

if (!configuration) {
	throw new Error(`Unknown NODE_ENV: ${environment}`);
}

const sequelize = new Sequelize(
	configuration.database,
	configuration.username,
	configuration.password,
	{
		dialect: configuration.dialect,
		host: configuration.host,
		port: configuration.port,
		logging: configuration.logging,
		dialectOptions: configuration.dialectOptions,
	},
);

fs.readdirSync(__dirname)
	.filter(
		(file) =>
			!file.startsWith(".") &&
			file !== basename &&
			file.endsWith(".cjs") &&
			!file.endsWith(".test.cjs"),
	)
	.forEach((file) => {
		const model = require(path.join(__dirname, file))(sequelize, DataTypes);
		db[model.name] = model;
	});

Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
