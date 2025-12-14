import { playwright } from "@vitest/browser-playwright";

import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	loadEnv(mode, ".", "");
	return {
		server: {
			port: 3000,
			host: "0.0.0.0",
		},
		plugins: [],
		optimizeDeps: {
			include: ["@awesome.me/webawesome/dist/components/spinner/spinner.js"],
			esbuildOptions: {
				target: "esnext",
			},
		},
		test: {
			browser: {
				enabled: true,
				headless: true,
				provider: playwright(),
				instances: [{ browser: "chromium" }],
			},
		},
	};
});
