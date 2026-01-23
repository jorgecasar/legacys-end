import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./game-hud.js";
import axe from "axe-core";

/** @typedef {import('../../game/interfaces.js').IQuestStateService} IQuestStateService */
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
		const element = /** @type {GameHud} */ (document.createElement("game-hud"));
		element.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				levelTitle: { get: () => "Default Level" },
				questTitle: { get: () => "" },
				currentChapterNumber: { get: () => 1 },
				totalChapters: { get: () => 1 },
			})
		);
		container.appendChild(element);
		await element.updateComplete;

		const h5 = element.shadowRoot?.querySelector("h5");
		expect(h5).toBeTruthy();
	});

	it("renders level and quest title", async () => {
		const element = /** @type {GameHud} */ (document.createElement("game-hud"));
		element.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				levelTitle: { get: () => "Level 1" },
				questTitle: { get: () => "Quest 1" },
				currentChapterNumber: { get: () => 1 },
				totalChapters: { get: () => 1 },
			})
		);
		container.appendChild(element);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent).toContain("Level 1");
		expect(element.shadowRoot?.textContent).toContain("Quest 1");
	});

	it("renders chapter progress correct", async () => {
		const element = /** @type {GameHud} */ (document.createElement("game-hud"));
		element.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				levelTitle: { get: () => "Level 1" },
				questTitle: { get: () => "Quest 1" },
				currentChapterNumber: { get: () => 2 },
				totalChapters: { get: () => 5 },
			})
		);
		container.appendChild(element);
		await element.updateComplete;

		const counter = element.shadowRoot?.querySelector(".chapter-counter");
		expect(counter?.textContent).toContain("2/5");
	});

	it("should have no accessibility violations", async () => {
		const element = /** @type {GameHud} */ (document.createElement("game-hud"));
		element.questState = /** @type {IQuestStateService} */ (
			/** @type {unknown} */ ({
				levelTitle: { get: () => "Level 1" },
				questTitle: { get: () => "Quest 1" },
				currentChapterNumber: { get: () => 1 },
				totalChapters: { get: () => 1 },
			})
		);
		container.appendChild(element);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
