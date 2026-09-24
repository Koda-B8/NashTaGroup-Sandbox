import oxfmt from "@kekkon-nexus/config/oxfmt";
import { defineConfig } from "oxfmt";

export default defineConfig({
	...oxfmt,
	sortTailwindcss: {
		stylesheet: "./apps/frontend/src/index.css",
		functions: ["cn"],
		preserveWhitespace: true,
	},
});
