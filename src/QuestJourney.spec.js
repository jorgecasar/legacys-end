import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import "./components/legacys-end-app/legacys-end-app.js";

describe("Quest Journey E2E", () => {
	/** @type {any} */
	let app;

	beforeEach(async () => {
		// Clear storage to start fresh
		localStorage.clear();

		document.body.innerHTML = "";

		// Disable animations for stability in E2E
		const style = document.createElement("style");
		style.textContent = `
			* { 
				animation: none !important; 
				transition: none !important; 
			}
		`;
		document.head.appendChild(style);

		app = document.createElement("legacys-end-app");
		document.body.appendChild(app);

		// Wait for initialization
		await app.gameInitialized;
		// Wait for intro dialog and close it if present
		await new Promise((resolve) => setTimeout(resolve, 500));
		const introDialog = app.shadowRoot?.getElementById("intro-dialog");
		if (introDialog?.open) {
			introDialog.open = false;
		}
	});

	it("should complete a full quest journey: Hub -> Quest -> Chapter 1 -> Hub -> Resume -> Chapter 2 -> Victory", async () => {
		// 1. Verify we are in the Hub
		const hub = app.shadowRoot.querySelector("quest-hub");
		expect(hub).toBeTruthy();

		// 2. Start "The Aura of Sovereignty"
		// Aura's quest ID is 'the-aura-of-sovereignty'
		const questCards = hub.shadowRoot.querySelectorAll("quest-card");
		const auraCard = Array.from(questCards).find(
			(c) => c.quest.id === "the-aura-of-sovereignty",
		);
		expect(auraCard).toBeTruthy();

		const startBtn = auraCard.shadowRoot.querySelector(
			'wa-button[variant="brand"]',
		);
		expect(startBtn).toBeTruthy();
		await userEvent.click(startBtn);

		// 3. Verify Game View is loaded
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const gameView = app.shadowRoot.querySelector("game-view");
		expect(gameView).toBeTruthy();
		expect(app.sessionManager.isInHub.get()).toBe(false);

		// 4. Move to NPC and Interact
		app.gameState.setHeroPosition(40, 50); // Close to NPC at {40, 55}
		await new Promise((resolve) => setTimeout(resolve, 200));
		await userEvent.keyboard(" "); // Interact

		// Verify Dialog appears
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const dialog = gameView.shadowRoot.querySelector("level-dialog");
		expect(dialog).toBeTruthy();

		// Pass slides until complete
		let nextBtn = dialog.shadowRoot.querySelector("#next-btn");
		while (nextBtn) {
			await userEvent.click(nextBtn);
			await new Promise((resolve) => setTimeout(resolve, 300)); // Animation
			nextBtn = dialog.shadowRoot.querySelector("#next-btn");
		}

		const evolveBtn = dialog.shadowRoot.querySelector("#evolve-btn");
		if (evolveBtn) {
			// Using native click as a safest fallback if userEvent is too strict about stability
			evolveBtn.click();
		}

		// 5. Verify Item Collected and Exit Zone Active
		await new Promise((resolve) => setTimeout(resolve, 800));
		expect(app.gameState.hasCollectedItem.get()).toBe(true);

		// 6. Transition to Chapter 2
		// Simulate reaching exit zone
		app.eventBus.emit("exit-zone-reached");

		// Wait for transition animation
		await new Promise((resolve) => setTimeout(resolve, 1500));
		expect(app.questController.currentChapterIndex).toBe(1); // Chapter 2
		expect(app.questController.currentChapter.id).toBe("hall-of-fragments");

		// 7. Return to Hub
		await app.sessionManager.returnToHub();
		await new Promise((resolve) => setTimeout(resolve, 500));
		expect(app.sessionManager.isInHub.get()).toBe(true);

		// 8. Re-enter Quest (Continue)
		const hubReloaded = app.shadowRoot.querySelector("quest-hub");
		const questCards2 = hubReloaded.shadowRoot.querySelectorAll("quest-card");
		const auraCard2 = Array.from(questCards2).find(
			(c) => c.quest.id === "the-aura-of-sovereignty",
		);
		const resumeBtn = auraCard2.shadowRoot.querySelector(
			'wa-button[variant="brand"]',
		);
		await userEvent.click(resumeBtn);

		await new Promise((resolve) => setTimeout(resolve, 1000));
		expect(app.questController.currentChapterIndex).toBe(1); // Still Chapter 2
		expect(app.questController.currentChapter.id).toBe("hall-of-fragments");

		// 9. Complete Chapter 2 (Final)
		// Simulate interaction and completion for final chapter
		app.gameState.setCollectedItem(true);
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Reach exit zone of last chapter
		app.eventBus.emit("exit-zone-reached");

		// 10. Verify Victory Screen
		await new Promise((resolve) => setTimeout(resolve, 2000));
		const victoryScreen = app.shadowRoot
			.querySelector("game-view")
			.shadowRoot.querySelector("victory-screen");
		expect(victoryScreen).toBeTruthy();
		expect(app.gameState.isQuestCompleted.get()).toBe(true);

		// 11. Return to Hub from Victory Screen
		const returnHubBtn = victoryScreen.shadowRoot.querySelector("wa-button");
		if (returnHubBtn) {
			returnHubBtn.click();
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
		expect(app.sessionManager.isInHub.get()).toBe(true);
	}, 30000); // Higher timeout for E2E
});
