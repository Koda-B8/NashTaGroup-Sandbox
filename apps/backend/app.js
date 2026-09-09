import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import swaggerSpecification from "./config/swagger.js";
import authRoute from "./routes/AuthRoute.js";

const app = express();

// const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
// 	.split(",")
// 	.map((origin) => origin.trim())
// 	.filter(Boolean);

app.disable("x-powered-by");
app.use(
	cors({
		origin: "*",
		credentials: true,
	}),
);
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_request, response) => {
	return response.status(200).json({ success: true, message: "OK" });
});

app.get("/api-docs.json", (_request, response) => {
	return response.json(swaggerSpecification);
});
app.use(
	"/api/docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpecification, { explorer: true }),
);

app.use("/api/v1/auth", authRoute);
app.use((_request, response) => {
	return response.status(404).json({
		success: false,
		message: "Endpoint not found.",
	});
});
app.use((error, _request, response, _next) => {
	const statusCode = Number.isInteger(error.statusCode)
		? error.statusCode
		: 500;
	const message = statusCode >= 500 ? "Internal server error." : error.message;

	if (statusCode >= 500) console.error(error);

	return response.status(statusCode).json({ success: false, message });
});

export default app;
