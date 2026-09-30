import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const envDir = resolve(import.meta.dirname, "../..");

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, envDir, "");

	return {
		envDir,
		plugins: [react(), tailwindcss()],
		server: {
			proxy: {
				"/api": {
					target: env.API_PROXY_TARGET,
					changeOrigin: true,
				},
			},
		},
	};
});
