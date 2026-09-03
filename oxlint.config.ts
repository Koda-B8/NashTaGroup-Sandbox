import oxlint from "@kekkon-nexus/config/oxlint";
import react from "@kekkon-nexus/config/oxlint/react";
import { defineConfig } from "oxlint";

export default defineConfig({
	extends: [oxlint, react],
	rules: {
		"unicorn/filename-case": [
			"warn",
			{ cases: { kebabCase: true, pascalCase: true } },
		],
	},
});
