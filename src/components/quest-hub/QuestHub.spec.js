/**
 * @typedef {import("./QuestHub.js").QuestHub} QuestHub
 * @typedef {import("./components/quest-card/QuestCard.js").QuestCard} QuestCard
 */

import axe from "axe-core";
import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Difficulty } from "../../content/quests/quest-types.js";
import "./quest-hub.js";

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
				difficulty: Difficulty.BEGINNER,
				estimatedTime: "30 min",
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
				difficulty: Difficulty.ADVANCED,
				difficultyLabel: "Advanced",
				estimatedTime: "30 min",
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

		// Verify quest-card components are rendered
		const cards = el.shadowRoot?.querySelectorAll("quest-card");
		expect(cards?.length).toBe(2);

		// Verify quest data is passed to cards
		const firstCard = /** @type {QuestCard} */ (cards?.[0]);
		const secondCard = /** @type {QuestCard} */ (cards?.[1]);
		expect(firstCard?.quest?.id).toBe("q1");
		expect(secondCard?.quest?.id).toBe("q2");
	});

	it("renders coming soon quests", async () => {
		const comingSoonData = [
			{
				id: "q3",
				name: "Future Quest",
				description: "Coming Soon",
				difficulty: Difficulty.BEGINNER,
				estimatedTime: "30 min",
				icon: "quest-icon",
			},
		];

		render(
			html`<quest-hub .comingSoonQuests=${comingSoonData}></quest-hub>`,
			container,
		);
		const el = /** @type {QuestHub} */ (container.querySelector("quest-hub"));
		await el.updateComplete;

		// Verify coming soon section is rendered
		const section = el.shadowRoot?.querySelector(".coming-soon-section");
		expect(section).toBeTruthy();

		// Verify quest-card component is rendered with isComingSoon
		const cards = el.shadowRoot?.querySelectorAll("quest-card");
		expect(cards?.length).toBe(1);
		const card = /** @type {QuestCard} */ (cards?.[0]);
		expect(card?.quest?.id).toBe("q3");
		expect(card?.isComingSoon).toBe(true);
	});

	it("should have no accessibility violations", async () => {
		const questData = [
			{
				id: "q1",
				name: "Quest 1",
				description: "Desc 1",
				difficulty: Difficulty.BEGINNER,
				estimatedTime: "30 min",
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
