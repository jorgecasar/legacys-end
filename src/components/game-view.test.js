import { beforeEach, describe, expect, it } from "vitest";
import "./game-view.js";

describe("GameView Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders loading state when no config is provided", async () => {
		const el = document.createElement("game-view");
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Loading level data...");
	});

	it("renders game-viewport when config is provided", async () => {
		const el = document.createElement("game-view");
		el.currentConfig = {
			canToggleTheme: true,
			hasHotSwitch: true,
			isFinalBoss: false,
		};
		el.heroPos = { x: 0, y: 0 };
		document.body.appendChild(el);
		await el.updateComplete;

		const viewport = el.shadowRoot.querySelector("game-viewport");
		expect(viewport).toBeTruthy();
	});
});
