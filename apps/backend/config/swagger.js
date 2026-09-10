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
				csrfToken: {
					type: "apiKey",
					in: "header",
					name: "X-CSRF-Token",
					description:
						"Required for authenticated POST, PUT, PATCH, and DELETE requests.",
				},
			},
		},
	},
	apis: [routesGlob],
});

export default swaggerSpecification;
