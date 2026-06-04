import { registerSW } from "virtual:pwa-register";
import "./components/legacys-end-app/legacys-end-app.js";

// Register PWA Service Worker
const updateSW = registerSW({
	onNeedRefresh() {
		// Optional: Prompt the user to refresh when an update is available
		if (confirm("New content available. Reload?")) {
			updateSW(true);
		}
	},
	onOfflineReady() {
		console.log("App ready to work offline");
	},
});
