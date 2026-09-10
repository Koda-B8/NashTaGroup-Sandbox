import { fileURLToPath } from "node:url";

import swaggerJsdoc from "swagger-jsdoc";

const routesGlob = fileURLToPath(
	new URL("../src/routes/*.js", import.meta.url),
);

const swaggerSpecification = swaggerJsdoc({
	definition: {
		openapi: "3.1.0",
		info: {
			title: "NashTa Group API",
			version: "1.0.0",
			description: "NashTa Group REST API documentation.",
		},
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "auth_token",
					description: "HttpOnly authentication cookie.",
				},
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Used when the auth_token cookie is absent.",
				},
				csrfToken: {
					type: "apiKey",
					in: "header",
					name: "X-CSRF-Token",
					description:
						"Required for cookie-authenticated POST, PUT, PATCH, and DELETE requests.",
				},
			},
		},
	},
	apis: [routesGlob],
});

export default swaggerSpecification;
