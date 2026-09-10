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
			description: "Dokumentasi REST API NashTa Group.",
		},
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "auth_token",
					description: "JWT yang disimpan dalam cookie HttpOnly setelah login.",
				},
			},
		},
	},
	apis: [routesGlob],
});

export default swaggerSpecification;
