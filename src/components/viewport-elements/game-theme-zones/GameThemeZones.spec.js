import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./game-theme-zones.js";
import axe from "axe-core";

/** @typedef {import("./GameThemeZones.js").GameThemeZones} GameThemeZones */

describe("GameThemeZones Component", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders nothing when inactive", async () => {
		render(html`<game-theme-zones></game-theme-zones>`, container);
		const element = /** @type {GameThemeZones} */ (
			container.querySelector("game-theme-zones")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent?.trim()).toBe("");
		expect(element.shadowRoot?.querySelectorAll(".zone").length).toBe(0);
	});

	it("renders zones when active", async () => {
		render(html`<game-theme-zones active></game-theme-zones>`, container);
		const element = /** @type {GameThemeZones} */ (
			container.querySelector("game-theme-zones")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.querySelectorAll(".zone").length).toBe(2);
		expect(element.shadowRoot?.textContent).toContain("Light Theme");
		expect(element.shadowRoot?.textContent).toContain("Dark Theme");
	});

	it("should have no accessibility violations", async () => {
		render(html`<game-theme-zones active></game-theme-zones>`, container);
		const element = /** @type {GameThemeZones} */ (
			container.querySelector("game-theme-zones")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
