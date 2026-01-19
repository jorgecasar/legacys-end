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
		// Wait for first render
		await app.updateComplete;

		const introDialog = app.shadowRoot?.getElementById("intro-dialog");
		if (introDialog?.open) {
			introDialog.open = false;
		}

		window.onerror = (message, source, lineno, colno, error) => {
			console.error(
				`[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno}`,
				error?.stack,
			);
		};
		window.onunhandledrejection = (event) => {
			console.error(`[UNHANDLED REJECTION]`, event.reason);
		};
	});

	it("should complete a full quest journey: Hub -> Quest -> Chapter 1 -> Hub -> Resume -> Chapter 2 -> Victory", async () => {
		try {
			// 1. Verify we are in the Hub
			// Allow some time for hub to render and components to load
			let hub = null;
			for (let i = 0; i < 20; i++) {
				hub = app.shadowRoot.querySelector("quest-hub");
				if (hub) break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			expect(hub).toBeTruthy();
			await customElements.whenDefined("quest-hub");
			await hub.updateComplete;

			// 2. Start "The Aura of Sovereignty"
			// Aura's quest ID is 'the-aura-of-sovereignty'
			const questCards = hub.shadowRoot.querySelectorAll("quest-card");
			console.error(`[DEBUG] Found ${questCards.length} quest cards`);
			const auraCard = Array.from(questCards).find(
				(c) => c.quest?.id === "the-aura-of-sovereignty",
			);
			expect(auraCard, "Aura card should exist").toBeTruthy();
			await auraCard.updateComplete;

			// Wait for the start button to appear
			let startBtn = null;
			for (let i = 0; i < 50; i++) {
				startBtn = auraCard.shadowRoot.querySelector(
					'wa-button[variant="brand"]',
				);
				if (startBtn) break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			if (!startBtn) {
				console.error(`[DEBUG_HTML] ${auraCard.shadowRoot.innerHTML}`);
				throw new Error("Start button not found in card");
			}
			expect(startBtn, "Start button should exist").toBeTruthy();

			await userEvent.click(startBtn);

			// 3. Verify Game View is loaded
			let gameView = null;
			for (let i = 0; i < 40; i++) {
				gameView = app.shadowRoot.querySelector("quest-view");
				if (gameView) break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			if (gameView) await gameView.updateComplete;
			expect(gameView, "Game view should be visible after click").toBeTruthy();
			expect(app.sessionService.isInHub.get(), "Should not be in hub").toBe(
				false,
			);

			// 4. Move to NPC and Interact
			app.heroState.setPos(40, 54); // Close to NPC at {40, 55}
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
			expect(app.questState.hasCollectedItem.get()).toBe(true);

			// 6. Transition to Chapter 2
			// Simulate reaching exit zone
			const viewportFirst = gameView.shadowRoot?.querySelector("game-viewport");
			if (viewportFirst?.gameController) {
				viewportFirst.gameController.handleExitZoneReached();
			} else {
				throw new Error(
					"Game controller not found in quest-view viewport (Chapter 1)",
				);
			}

			// Wait for transition animation
			await new Promise((resolve) => setTimeout(resolve, 1500));
			expect(app.questController.currentChapterIndex).toBe(1); // Chapter 2
			expect(app.questController.currentChapter.id).toBe("hall-of-fragments");

			// 7. Return to Hub
			await app.questLoader.returnToHub();
			await new Promise((resolve) => setTimeout(resolve, 500));
			expect(app.sessionService.isInHub.get()).toBe(true);

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
			app.questState.setHasCollectedItem(true);
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Reach exit zone of last chapter
			const questViewResumed = app.shadowRoot.querySelector("quest-view");
			const viewport =
				questViewResumed?.shadowRoot?.querySelector("game-viewport");
			if (viewport?.gameController) {
				viewport.gameController.handleExitZoneReached();
			} else {
				throw new Error("Game controller not found in quest-view viewport");
			}

			// 10. Verify Victory Screen
			await new Promise((resolve) => setTimeout(resolve, 2000));
			const victoryScreen = app.shadowRoot
				.querySelector("quest-view")
				.shadowRoot.querySelector("victory-screen");
			expect(victoryScreen).toBeTruthy();
			expect(app.questState.isQuestCompleted.get()).toBe(true);

			// 11. Return to Hub from Victory Screen
			const returnHubBtn = victoryScreen.shadowRoot.querySelector("wa-button");
			if (returnHubBtn) {
				returnHubBtn.click();
			}

			await new Promise((resolve) => setTimeout(resolve, 1000));
			expect(app.sessionService.isInHub.get()).toBe(true);
		} catch (/** @type {any} */ error) {
			console.error("TEST FAILED WITH ERROR:", error.message);
			if (error.stack) console.error("STACK TRACE:", error.stack);
			throw error;
		}
	}, 30000);
	// Higher timeout for E2E
});
