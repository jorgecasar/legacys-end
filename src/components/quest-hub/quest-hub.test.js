import { beforeEach, describe, expect, it } from "vitest";
import "./quest-hub.js";

/** @typedef {import("./quest-hub.js").QuestHub} QuestHub */

describe("QuestHub Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders available quests", async () => {
		const el = /** @type {QuestHub} */ (document.createElement("quest-hub"));
		/**
		 * @type {import("../../content/quests/quest-types.js").EnrichedQuest[]}
		 */
		el.quests = [
			{
				id: "q1",
				name: "Quest 1",
				description: "Desc 1",
				difficulty: "Beginner",
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
				progress: 50,
				isCompleted: false,
				isLocked: false,
				inProgress: true,
			},
		];
		document.body.appendChild(el);
		await el.updateComplete;

		const cards = el.shadowRoot.querySelectorAll("wa-card");
		expect(cards.length).toBe(2);
		expect(el.shadowRoot.textContent).toContain("Quest 1");
		expect(el.shadowRoot.textContent).toContain("Quest 2");
	});

	it("renders coming soon quests", async () => {
		const el = /** @type {QuestHub} */ (document.createElement("quest-hub"));
		/**
		 * @type {import("../../content/quests/quest-types.js").Quest[]}
		 */
		el.comingSoonQuests = [
			{
				id: "q3",
				name: "Future Quest",
				description: "Coming Soon",
				difficulty: "Beginner",
			},
		];
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Future Quest");
	});
});
