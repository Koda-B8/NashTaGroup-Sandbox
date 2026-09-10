const path = require("node:path");

module.exports = {
	"config": path.resolve(__dirname, "config", "config.cjs"),
	"migrations-path": path.resolve(__dirname, "db", "migrations"),
	"seeders-path": path.resolve(__dirname, "db", "seeders"),
};
