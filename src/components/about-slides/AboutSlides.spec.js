import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./about-slides.js";
import axe from "axe-core";

/** @typedef {import("./AboutSlides.js").AboutSlides} AboutSlides */

describe("AboutSlides Component", () => {
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
		render(html`<about-slides></about-slides>`, container);
		const el = /** @type {AboutSlides} */ (
			container.querySelector("about-slides")
		);
		await el.updateComplete;

		const dialog = el.shadowRoot?.querySelector("wa-dialog");
		expect(dialog).toBeTruthy();
		expect(dialog?.getAttribute("label")).toBe("About Legacy's End");
	});

	it("shows and hides dialog", async () => {
		render(html`<about-slides></about-slides>`, container);
		const el = /** @type {AboutSlides} */ (
			container.querySelector("about-slides")
		);
		await el.updateComplete;

		el.show();
		const dialog = /** @type {any} */ (
			el.shadowRoot?.querySelector("wa-dialog")
		);
		expect(dialog.open).toBe(true);

		el.hide();
		expect(dialog.open).toBe(false);
	});

	it("should have no accessibility violations", async () => {
		render(html`<about-slides></about-slides>`, container);
		const el = /** @type {AboutSlides} */ (
			container.querySelector("about-slides")
		);
		await el.updateComplete;

		// Since the dialog is closed by default, we might need to open it or test the closed state.
		// Testing closed state first.
		let results = await axe.run(el);
		expect(results.violations).toEqual([]);

		// Test open state
		el.show();
		await el.updateComplete;
		// Await for dialog animation if any, but axe should handle DOM snapshot.
		results = await axe.run(el);
		expect(results.violations).toEqual([]);
	});
});
