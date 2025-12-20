import { playwright } from "@vitest/browser-playwright";

import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	loadEnv(mode, ".", "");
	return {
		base: process.env.NODE_ENV === 'production' ? '/legacys-end/' : '/',
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
			coverage: {
				provider: 'v8',
				reporter: ['text', 'json', 'html', 'json-summary'],
				include: ['src/**/*.js'],
			},
		},
	};
});
