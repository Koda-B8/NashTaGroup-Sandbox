import oxfmt from "@kekkon-nexus/config/oxfmt";
import oxlint from "@kekkon-nexus/config/oxlint";
import react from "@kekkon-nexus/config/oxlint/react";
import vp from "@kekkon-nexus/config/oxlint/vite-plus";
import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: { ...oxfmt },
	lint: {
		extends: [oxlint, react, vp],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	staged: {
		"*": "vp check --no-error-on-unmatched-pattern --fix",
	},
});
