/* eslint-disable no-undef */

import cors from "cors";
import express from "express";

import authRoute from "./routes/authRoute.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_request, response) => {
	return response.status(200).json({ success: true, message: "OK" });
});

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
