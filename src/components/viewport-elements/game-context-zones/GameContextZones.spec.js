import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./game-context-zones.js";
import axe from "axe-core";

/** @typedef {import("./GameContextZones.js").GameContextZones} GameContextZones */

describe("GameContextZones Component", () => {
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
		render(html`<game-context-zones></game-context-zones>`, container);
		const element = /** @type {GameContextZones} */ (
			container.querySelector("game-context-zones")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent?.trim()).toBe("");
		expect(element.shadowRoot?.querySelectorAll(".ctx-zone").length).toBe(0);
	});

	it("renders zones when active and sets correct activity states", async () => {
		render(
			html`<game-context-zones active state="legacy"></game-context-zones>`,
			container,
		);
		const element = /** @type {GameContextZones} */ (
			container.querySelector("game-context-zones")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.querySelectorAll(".ctx-zone").length).toBe(2);

		const legacyZone = element.shadowRoot?.querySelector(".ctx-legacy");
		const newZone = element.shadowRoot?.querySelector(".ctx-new");

		expect(legacyZone?.classList.contains("active")).toBe(true);
		expect(newZone?.classList.contains("inactive")).toBe(true);
	});

	it("renders zones when active and sets correct activity states (new stack)", async () => {
		render(
			html`<game-context-zones active state="new"></game-context-zones>`,
			container,
		);
		const element = /** @type {GameContextZones} */ (
			container.querySelector("game-context-zones")
		);
		await element.updateComplete;

		const legacyZone = element.shadowRoot?.querySelector(".ctx-legacy");
		const newZone = element.shadowRoot?.querySelector(".ctx-new");

		expect(legacyZone?.classList.contains("inactive")).toBe(true);
		expect(newZone?.classList.contains("active")).toBe(true);
	});

	it("should have no accessibility violations", async () => {
		render(
			html`<game-context-zones active state="legacy"></game-context-zones>`,
			container,
		);
		const element = /** @type {GameContextZones} */ (
			container.querySelector("game-context-zones")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
