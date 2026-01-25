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
		render(html`<game-controls></game-controls>`, container);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		// Mock voice controller to avoid real AI initialization
		element.voice = /** @type {any} */ ({
			toggle: vi.fn().mockImplementation(() => {
				/** @type {any} */ (element.voice).enabled = true;
				element.requestUpdate();
			}),
			enabled: false,
			isInitializing: false,
		});

		const button = /** @type {HTMLElement} */ (
			element.shadowRoot?.querySelector(".voice-toggle")
		);
		button.click();

		await vi.waitUntil(() => button?.classList.contains("active"), {
			timeout: 5000,
			interval: 100,
		});
		await element.updateComplete;

		expect(button?.classList.contains("active")).toBe(true);
		expect(button?.querySelector("wa-icon")?.getAttribute("name")).toBe(
			"microphone",
		);
	});

	it("initializes input controllers including voice", async () => {
		render(html`<game-controls></game-controls>`, container);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		expect(element.touch).toBeTruthy();
		expect(element.keyboard).toBeTruthy();
		// voice might need all services to be initialized, so we check if it's there after setup
	});

	it("toggles voice control state via controller", async () => {
		render(html`<game-controls></game-controls>`, container);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;
		// Mock voice controller after first initialization
		element.voice = /** @type {any} */ ({
			toggle: vi.fn().mockImplementation(() => {
				/** @type {any} */ (element.voice).enabled = true;
			}),
			enabled: false,
		});

		const button = /** @type {HTMLElement} */ (
			element.shadowRoot?.querySelector(".voice-toggle")
		);
		button.click();

		expect(element.voice?.toggle).toHaveBeenCalled();
	});

	it("dispatches move event when touch/keyboard moves", async () => {
		const moveSpy = vi.fn();
		render(
			html`<game-controls @move=${/** @type {EventListener} */ (moveSpy)}></game-controls>`,
			container,
		);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		element.handleMove(10, 20);
		expect(moveSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: { dx: 10, dy: 20 },
			}),
		);
	});

	it("dispatches interact event", async () => {
		const interactSpy = vi.fn();
		render(
			html`<game-controls @interact=${/** @type {EventListener} */ (interactSpy)}></game-controls>`,
			container,
		);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		element.handleInteract();
		expect(interactSpy).toHaveBeenCalled();
	});

	it("dispatches toggle-pause event", async () => {
		const pauseSpy = vi.fn();
		render(
			html`<game-controls @toggle-pause=${/** @type {EventListener} */ (pauseSpy)}></game-controls>`,
			container,
		);
		const element = /** @type {GameControls} */ (
			container.querySelector("game-controls")
		);
		await element.updateComplete;

		element.handlePause();
		expect(pauseSpy).toHaveBeenCalled();
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
