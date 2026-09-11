import { constants } from "node:http2";

export function requireRole(...allowedRoles) {
	return function roleMiddleware(request, response, next) {
		if (!request.user || !allowedRoles.includes(request.user.role)) {
			return response.status(constants.HTTP_STATUS_FORBIDDEN).json({
				success: false,
				message: "Forbidden: insufficient permissions",
			});
		}

		return next();
	};
}
