import { fileURLToPath } from "node:url";

import swaggerJsdoc from "swagger-jsdoc";

const routesGlob = fileURLToPath(
	new URL("../src/routes/*.js", import.meta.url),
);

const swaggerSpecification = swaggerJsdoc({
	definition: {
		openapi: "3.0.3",
		info: {
			title: "NashTa Group API",
			version: "1.0.0",
			description: "Dokumentasi REST API NashTa Group.",
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	},
	apis: [routesGlob],
});

export default swaggerSpecification;
