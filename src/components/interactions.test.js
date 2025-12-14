import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameView } from "./game-view.js";
import { LevelDialog } from "./level-dialog.js";

// Mock WebAwesome components to avoid rendering issues in JSDOM
vi.mock("@awesome.me/webawesome/dist/components/dialog/dialog.js", () => ({}));
vi.mock("@awesome.me/webawesome/dist/components/button/button.js", () => ({}));
vi.mock("@awesome.me/webawesome/dist/components/icon/icon.js", () => ({}));
vi.mock("./game-viewport.js", () => ({})); // Mock child component

describe("LevelDialog Interactions", () => {
	let element;
	let container;

	beforeEach(async () => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container) {
			container.remove();
		}
		vi.clearAllMocks();
	});

	it("should increment slideIndex when NEXT is clicked", async () => {
		// Setup complex config to have multiple slides
		const config = {
			title: "Test Level",
			description: "Intro",
			problemDesc: "Problem",
			codeSnippets: { start: "code" },
		};

		element = new LevelDialog();
		element.config = config;
		container.appendChild(element);
		await element.updateComplete;

		// Initial state
		expect(element.slideIndex).toBe(0);

		// Find NEXT button
		const buttons = element.shadowRoot.querySelectorAll("wa-button");
		const nextBtn = buttons[buttons.length - 1];

		expect(nextBtn.textContent.trim()).toContain("NEXT");

		nextBtn.click();
		await element.updateComplete;

		expect(element.slideIndex).toBe(1);
	});

	it("should decrement slideIndex when PREV is clicked", async () => {
		const config = {
			title: "Test Level",
			description: "Intro",
			problemDesc: "Problem",
		};

		element = new LevelDialog();
		element.config = config;
		element.slideIndex = 1; // Start at second slide
		container.appendChild(element);
		await element.updateComplete;

		expect(element.slideIndex).toBe(1);

		const buttons = element.shadowRoot.querySelectorAll("wa-button");
		const prevBtn = buttons[0]; // First button is PREV

		expect(prevBtn.textContent.trim()).toContain("PREV");

		prevBtn.click();
		await element.updateComplete;

		expect(element.slideIndex).toBe(0);
	});

	it("should dispatch 'complete' event on final slide button click", async () => {
		const config = {
			title: "Test Level",
			description: "Intro",
			// Only 2 slides total: Narrative -> Confirmation
		};

		element = new LevelDialog();
		element.config = config;
		// Narrative is index 0. Confirmation is index 1 (last).
		element.slideIndex = 1;
		container.appendChild(element);
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener("complete", completeSpy);

		const buttons = element.shadowRoot.querySelectorAll("wa-button");
		const actionBtn = buttons[buttons.length - 1]; // "EVOLVE" or "COMPLETE"

		expect(actionBtn.textContent.trim()).toMatch(/EVOLVE|COMPLETE/);

		actionBtn.click();

		expect(completeSpy).toHaveBeenCalled();
	});
});

describe("GameView Integration", () => {
	let element;
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container) {
			container.remove();
		}
		vi.clearAllMocks();
	});

	it("should re-dispatch 'complete' event from level-dialog", async () => {
		element = new GameView();
		element.gameState = {
			config: { title: "Test" },
			hero: { pos: { x: 0, y: 0 } },
			ui: { showDialog: true },
		};
		container.appendChild(element);
		await element.updateComplete;

		const completeSpy = vi.fn();
		element.addEventListener("complete", completeSpy);

		const dialog = element.shadowRoot.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		dialog.dispatchEvent(new CustomEvent("complete"));

		expect(completeSpy).toHaveBeenCalled();
	});

	it("should re-dispatch 'close-dialog' event from level-dialog close", async () => {
		element = new GameView();
		element.gameState = {
			config: { title: "Test" },
			hero: { pos: { x: 0, y: 0 } },
			ui: { showDialog: true },
		};
		container.appendChild(element);
		await element.updateComplete;

		const closeSpy = vi.fn();
		element.addEventListener("close-dialog", closeSpy);

		const dialog = element.shadowRoot.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		dialog.dispatchEvent(new CustomEvent("close"));

		expect(closeSpy).toHaveBeenCalled();
	});
});
