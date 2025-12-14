import { beforeEach, describe, expect, it } from "vitest";
import "./legacys-end-app.js";

describe("LegacysEndApp Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders successfully", async () => {
		const el = document.createElement("legacys-end-app");
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot).toBeTruthy();
	});

	it("renders quest-hub when in hub", async () => {
		const el = document.createElement("legacys-end-app");
		// Force hub state
		el.isInHub = true;
		el.hasSeenIntro = true;

		document.body.appendChild(el);
		await el.updateComplete;

		const hub = el.shadowRoot.querySelector("quest-hub");
		expect(hub).toBeTruthy();
	});
});
