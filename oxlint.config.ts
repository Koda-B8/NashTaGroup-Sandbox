import oxlint from "@kekkon-nexus/config/oxlint";
import react from "@kekkon-nexus/config/oxlint/react";
import { defineConfig } from "oxlint";

export default defineConfig({
	extends: [oxlint, react],

	globals: {
		document: "readonly",
	},
	rules: {
		"typescript/no-non-null-assertion": "off",
		"unicorn/filename-case": [
			"warn",
			{
				cases: { kebabCase: true, pascalCase: true },
				ignore: [`^\\+[A-Z0-9]`],
			},
		],
	},
});
