import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./game-exit-zone.js";
import axe from "axe-core";

/** @typedef {import("./GameExitZone.js").GameExitZone} GameExitZone */

describe("GameExitZone Component", () => {
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
		render(html`<game-exit-zone></game-exit-zone>`, container);
		const element = /** @type {GameExitZone} */ (
			container.querySelector("game-exit-zone")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent?.trim()).toBe("");
		expect(element.shadowRoot?.querySelector("wa-tag")).toBeNull();
	});

	it("renders exit label when active", async () => {
		const config = { x: 50, y: 50, width: 10, height: 10, label: "ESCAPE" };
		render(
			html`<game-exit-zone .active=${true} .zoneConfig=${config}></game-exit-zone>`,
			container,
		);
		const element = /** @type {GameExitZone} */ (
			container.querySelector("game-exit-zone")
		);
		await element.updateComplete;

		const tag = element.shadowRoot?.querySelector("wa-tag");
		expect(tag).toBeTruthy();
		expect(tag?.textContent).toContain("ESCAPE");
	});

	it("should have no accessibility violations", async () => {
		const config = { x: 50, y: 50, width: 10, height: 10, label: "ESCAPE" };
		render(
			html`<game-exit-zone .active=${true} .zoneConfig=${config}></game-exit-zone>`,
			container,
		);
		const element = /** @type {GameExitZone} */ (
			container.querySelector("game-exit-zone")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
