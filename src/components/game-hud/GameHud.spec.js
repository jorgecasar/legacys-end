import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./game-hud.js";
import axe from "axe-core";

/** @typedef {import("./GameHud.js").GameHud} GameHud */

describe("GameHud Component", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders correctly with default props", async () => {
		render(html`<game-hud></game-hud>`, container);
		const element = /** @type {GameHud} */ (
			container.querySelector("game-hud")
		);
		await element.updateComplete;

		const h5 = element.shadowRoot?.querySelector("h5");
		expect(h5).toBeTruthy();
	});

	it("renders level and quest title", async () => {
		render(
			html`<game-hud levelTitle="Level 1" questTitle="Quest 1"></game-hud>`,
			container,
		);
		const element = /** @type {GameHud} */ (
			container.querySelector("game-hud")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent).toContain("Level 1");
		expect(element.shadowRoot?.textContent).toContain("Quest 1");
	});

	it("renders chapter progress correct", async () => {
		render(
			html`<game-hud currentChapterNumber=${2} totalChapters=${5}></game-hud>`,
			container,
		);
		const element = /** @type {GameHud} */ (
			container.querySelector("game-hud")
		);
		await element.updateComplete;

		const counter = element.shadowRoot?.querySelector(".chapter-counter");
		expect(counter?.textContent).toContain("2/5");
	});

	it("should have no accessibility violations", async () => {
		render(
			html`<game-hud levelTitle="Level 1" questTitle="Quest 1"></game-hud>`,
			container,
		);
		const element = /** @type {GameHud} */ (
			container.querySelector("game-hud")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
