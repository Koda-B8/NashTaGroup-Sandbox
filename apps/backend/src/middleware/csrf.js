import { timingSafeEqual } from "node:crypto";
import { constants } from "node:http2";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const tokensMatch = (expected, received) => {
	const expectedBuffer = Buffer.from(expected);
	const receivedBuffer = Buffer.from(received);

	return (
		expectedBuffer.length === receivedBuffer.length &&
		timingSafeEqual(expectedBuffer, receivedBuffer)
	);
};

export default function csrfProtection(req, res, next) {
	const authToken = req.cookies?.auth_token;

	if (
		!UNSAFE_METHODS.has(req.method) ||
		req.path === "/auth/login" ||
		typeof authToken !== "string" ||
		!authToken
	) {
		return next();
	}

	const cookieToken = req.cookies?.csrf_token;
	const headerToken = req.get("X-CSRF-Token");

	if (
		typeof cookieToken !== "string" ||
		typeof headerToken !== "string" ||
		!tokensMatch(cookieToken, headerToken)
	) {
		return res.status(constants.HTTP_STATUS_FORBIDDEN).json({
			success: false,
			message: "Invalid or missing CSRF token",
		});
	}

	return next();
}
