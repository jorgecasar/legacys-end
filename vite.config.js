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
			esbuildOptions: {
				target: "esnext",
			},
		},
	};
});
