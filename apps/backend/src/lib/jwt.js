import process from "node:process";

import jwt from "jsonwebtoken";

function getRequiredEnvironmentVariable(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} environment variable is required.`);
	}

	return value;
}

const JWT_SECRET = getRequiredEnvironmentVariable("JWT_SECRET");
const JWT_EXPIRES_IN =
	/** @type {import("jsonwebtoken").SignOptions["expiresIn"]} */ (
		process.env.JWT_EXPIRES_IN ?? "70D"
	);

export function signToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
	return jwt.verify(token, JWT_SECRET);
}
