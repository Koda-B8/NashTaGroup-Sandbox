import cookieParser from "cookie-parser";

import { authenticateToken, getRequestToken } from "../middleware/auth.js";

const ALLOWED_ROLES = new Set(["admin", "cashier"]);

export function configureRealtimeServer(io) {
	io.engine.use(cookieParser());
	io.use(async (socket, next) => {
		try {
			const user = await authenticateToken(getRequestToken(socket.request));
			if (!user || !ALLOWED_ROLES.has(user.role)) {
				return next(new Error("Unauthorized"));
			}

			socket.data.user = user;
			return next();
		} catch (error) {
			return next(error);
		}
	});
	io.on("connection", (socket) => {
		socket.join(`role:${socket.data.user.role}`);
		socket.join(`user:${socket.data.user.id}`);
	});

	return io;
}
