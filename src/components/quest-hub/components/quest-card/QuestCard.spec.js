import axe from "axe-core";
import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./quest-card.js";

/** @typedef {import("./QuestCard.js").QuestCard} QuestCard */

describe("QuestCard Component", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("renders a quest card with basic data", async () => {
		const quest = {
			id: "q1",
			name: "Test Quest",
			description: "Test Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			icon: "box",
			progress: 0,
			isCompleted: false,
			isLocked: false,
			inProgress: false,
		};

		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain("Test Quest");
		expect(el.shadowRoot?.textContent).toContain("Test Description");
		expect(el.shadowRoot?.textContent).toContain("Beginner");
	});

	it("shows Start button for new quest", async () => {
		const quest = {
			id: "q1",
			name: "New Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 0,
			isCompleted: false,
			isLocked: false,
		};

		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		const button = el.shadowRoot?.querySelector(
			'wa-button[slot="footer-actions"]',
		);
		expect(button?.textContent?.trim()).toContain("Start");
	});

	it("shows Continue button for in-progress quest", async () => {
		const quest = {
			id: "q1",
			name: "In Progress Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 50,
			isCompleted: false,
			isLocked: false,
			inProgress: true,
		};

		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		const button = el.shadowRoot?.querySelector(
			'wa-button[slot="footer-actions"]',
		);
		expect(button?.textContent?.trim()).toContain("Continue");
	});

	it("shows Restart button for completed quest", async () => {
		const quest = {
			id: "q1",
			name: "Completed Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 100,
			isCompleted: true,
			isLocked: false,
		};

		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		const button = el.shadowRoot?.querySelector(
			'wa-button[slot="footer-actions"]',
		);
		expect(button?.textContent?.trim()).toContain("Restart");
	});

	it("shows locked state for locked quest", async () => {
		const quest = {
			id: "q1",
			name: "Locked Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 0,
			isCompleted: false,
			isLocked: true,
		};

		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		const button = el.shadowRoot?.querySelector(
			'wa-button[slot="footer-actions"]',
		);
		expect(button?.textContent?.trim()).toContain("Locked");
		expect(button?.hasAttribute("disabled")).toBe(true);
	});

	it("shows coming soon state", async () => {
		const quest = {
			id: "q1",
			name: "Future Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
		};

		render(
			html`<quest-card .quest=${quest} .isComingSoon=${true}></quest-card>`,
			container,
		);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain("Coming soon");
	});

	it("emits quest-select event when starting a quest", async () => {
		const quest = {
			id: "q1",
			name: "Test Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 0,
			isCompleted: false,
			isLocked: false,
		};

		const selectHandler = vi.fn();
		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		el.addEventListener("quest-select", selectHandler);
		await el.updateComplete;

		const button = /** @type {HTMLElement | null} */ (
			el.shadowRoot?.querySelector('wa-button[slot="footer-actions"]')
		);
		button?.click();

		expect(selectHandler).toHaveBeenCalled();
		expect(selectHandler.mock.calls[0][0].detail.questId).toBe("q1");
	});

	it("emits quest-continue event when continuing a quest", async () => {
		const quest = {
			id: "q1",
			name: "Test Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 50,
			isCompleted: false,
			isLocked: false,
		};

		const continueHandler = vi.fn();
		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		el.addEventListener("quest-continue", continueHandler);
		await el.updateComplete;

		const button = /** @type {HTMLElement | null} */ (
			el.shadowRoot?.querySelector('wa-button[slot="footer-actions"]')
		);
		button?.click();

		expect(continueHandler).toHaveBeenCalled();
		expect(continueHandler.mock.calls[0][0].detail.questId).toBe("q1");
	});

	it("should have no accessibility violations", async () => {
		const quest = {
			id: "q1",
			name: "Test Quest",
			description: "Description",
			difficulty: "Beginner",
			estimatedTime: "30 min",
			progress: 0,
			isCompleted: false,
			isLocked: false,
		};

		render(html`<quest-card .quest=${quest}></quest-card>`, container);
		const el = /** @type {QuestCard} */ (container.querySelector("quest-card"));
		await el.updateComplete;

		const results = await axe.run(el);
		expect(results.violations).toEqual([]);
	});
});
