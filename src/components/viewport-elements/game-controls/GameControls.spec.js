import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./game-controls.js";
import axe from "axe-core";

/** @typedef {import("./GameControls.js").GameControls} GameControls */

describe("GameControls Component", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders correctly", async () => {
		render(html`<game-controls></game-controls>`, container);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.querySelector("wa-details")).toBeTruthy();
		expect(element.shadowRoot?.querySelector("wa-button")).toBeTruthy();
	});

	it("toggles voice control state", async () => {
		render(
			html`<game-controls .isVoiceActive=${true}></game-controls>`,
			container,
		);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		const button = element.shadowRoot?.querySelector(".voice-toggle");
		expect(button?.classList.contains("active")).toBe(true);
		expect(button?.querySelector("wa-icon")?.getAttribute("name")).toBe(
			"microphone",
		);
	});

	it("dispatches toggle-voice event", async () => {
		const toggleSpy = vi.fn();
		render(
			html`<game-controls @toggle-voice=${/** @type {EventListener} */ (toggleSpy)}></game-controls>`,
			container,
		);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		const button = /** @type {HTMLElement} */ (
			element.shadowRoot?.querySelector(".voice-toggle")
		);
		button.click();

		expect(toggleSpy).toHaveBeenCalled();
	});

	it("should have no accessibility violations", async () => {
		render(html`<game-controls></game-controls>`, container);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
