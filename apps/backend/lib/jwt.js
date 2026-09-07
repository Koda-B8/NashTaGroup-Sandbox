/* eslint-disable no-undef */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "70D";

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required.");
}

export function signToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
	return jwt.verify(token, JWT_SECRET);
}
