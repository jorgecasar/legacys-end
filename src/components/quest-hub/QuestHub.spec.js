import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./quest-hub.js";
import axe from "axe-core";

/** @typedef {import("./QuestHub.js").QuestHub} QuestHub */

describe("QuestHub Component", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders available quests", async () => {
		const questData = [
			{
				id: "q1",
				name: "Quest 1",
				description: "Desc 1",
				difficulty: "Beginner",
				icon: "quest-icon",
				progress: 0,
				isCompleted: false,
				isLocked: false,
				inProgress: false,
			},
			{
				id: "q2",
				name: "Quest 2",
				description: "Desc 2",
				difficulty: "Advanced",
				icon: "quest-icon",
				progress: 50,
				isCompleted: false,
				isLocked: false,
				inProgress: true,
			},
		];

		render(html`<quest-hub .quests=${questData}></quest-hub>`, container);
		const el = /** @type {QuestHub} */ (container.querySelector("quest-hub"));
		await el.updateComplete;

		const cards = el.shadowRoot?.querySelectorAll("wa-card");
		expect(cards?.length).toBe(2);
		expect(el.shadowRoot?.textContent).toContain("Quest 1");
		expect(el.shadowRoot?.textContent).toContain("Quest 2");
	});

	it("renders coming soon quests", async () => {
		const comingSoonData = [
			{
				id: "q3",
				name: "Future Quest",
				description: "Coming Soon",
				difficulty: "Beginner",
				icon: "quest-icon",
			},
		];

		render(
			html`<quest-hub .comingSoonQuests=${comingSoonData}></quest-hub>`,
			container,
		);
		const el = /** @type {QuestHub} */ (container.querySelector("quest-hub"));
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain("Future Quest");
	});

	it("should have no accessibility violations", async () => {
		const questData = [
			{
				id: "q1",
				name: "Quest 1",
				description: "Desc 1",
				difficulty: "Beginner",
				icon: "quest-icon",
				progress: 0,
				isCompleted: false,
				isLocked: false,
				inProgress: false,
			},
		];

		render(html`<quest-hub .quests=${questData}></quest-hub>`, container);
		const el = /** @type {QuestHub} */ (container.querySelector("quest-hub"));
		await el.updateComplete;

		const results = await axe.run(el);
		expect(results.violations).toEqual([]);
	});
});
