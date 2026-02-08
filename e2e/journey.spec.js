import { expect, test } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";

test.describe("Quest Journey E2E", () => {
	test.beforeEach(async ({ page }) => {
		// 1. Visit the app
		await page.goto("/");

		// 2. Inject style to disable animations
		await page.addStyleTag({
			content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      `,
		});

		// 3. Wait for app load
		const app = page.locator("legacys-end-app");
		await expect(app).toBeAttached();
		await expect(app.locator("quest-hub")).toBeVisible({ timeout: 10000 });

		await injectAxe(page);
	});

	test("should complete a full quest journey: Hub -> Quest -> Chapter 1 -> Hub -> Resume -> Chapter 2 -> Victory", async ({
		page,
	}) => {
		// --- 1. Start Quest ---
		const hub = page.locator("legacys-end-app quest-hub");
		const auraCard = hub
			.locator("quest-card")
			.filter({ hasText: "The Aura of Sovereignty" });

		// Explicitly wait for web-components to upgrade and semantic elements
		await expect(hub.locator("quest-card").first()).toBeVisible();
		await expect(auraCard).toBeVisible();

		await checkA11y(page, "legacys-end-app", {
			rules: { "color-contrast": { enabled: false } },
		});

		// Snapshot: Quest Hub
		await expect(page).toHaveScreenshot("quest-hub.png");

		// Click Start
		await auraCard.locator('wa-button[variant="brand"]').click();

		// Verify Quest View
		const gameView = page.locator("legacys-end-app quest-view");
		await expect(gameView).toBeVisible({ timeout: 10000 });

		// Wait for viewport to stabilize for snapshot
		const viewport = gameView.locator("game-viewport");
		await expect(viewport).toBeVisible();

		await checkA11y(page, "legacys-end-app", {
			rules: { "color-contrast": { enabled: false } }
		});

		// Snapshot: Quest View (Initial)
		await expect(page).toHaveScreenshot("quest-view.png");

		// --- 2. Interact with NPC ---
		// Move Hero close to NPC (using evaluate to access internal state for stability/speed)
		await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			app.heroState.setPos(40, 54);
		});

		// Trigger interaction repeatedly until dialog opens (Robust E2E pattern)
		// This handles race conditions where hero might be *just* arriving or state updating
		await page.waitForFunction(
			async () => {
				const app = document.querySelector("legacys-end-app");
				const viewport = app.shadowRoot
					.querySelector("quest-view")
					.shadowRoot.querySelector("game-viewport");

				// Try to interact
				if (viewport?.handleInteract) {
					viewport.handleInteract();
				}

				// Check if dialog is open
				return app.worldState.showDialog.get() === true;
			},
			null,
			{ timeout: 10000, polling: 200 },
		);

		// Dialog handling
		const dialog = gameView.locator("level-dialog");
		await expect(dialog).toBeAttached();

		// Wait for the content container to be attached to ensure internal rendering
		await expect(dialog.locator(".dialog-content")).toBeAttached();

		await checkA11y(page, "legacys-end-app", {
			rules: { "color-contrast": { enabled: false } },
		});

		// Snapshot: Level Dialog
		await expect(page).toHaveScreenshot("level-dialog.png", {
			animations: "disabled",
			maxDiffPixelRatio: 0.05, // Tolerance for minor rendering variations
		});

		// Click Next until Evolve appears
		// We assume the button id is #next-btn provided in the shadow root
		// Playwright locator handles shadow DOM automatically usually, but let's be robust
		// The previous test logic looped clicks. In E2E manual clicks are safer.

		// Helper to click through dialog
		const handleDialog = async () => {
			const nextBtn = dialog.locator("#next-btn");
			const evolveBtn = dialog.locator("#evolve-btn");

			while (await nextBtn.isVisible()) {
				await nextBtn.click({ force: true });
				await page.waitForTimeout(100);
			}

			if (await evolveBtn.isVisible()) {
				await evolveBtn.click({ force: true });
			}
		};

		await handleDialog();

		// Verify Item Collected
		// We can check the state via evaluate
		const hasCollected = await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			return app.questState.hasCollectedItem.get();
		});
		expect(hasCollected).toBe(true);

		// --- 3. Complete Chapter 1 ---
		// Simulate reaching exit zone
		await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			const viewport = app.shadowRoot
				.querySelector("quest-view")
				.shadowRoot.querySelector("game-viewport");
			viewport.gameController.handleExitZoneReached();
		});

		// Wait for transition
		await page.waitForTimeout(1500);

		// Verify Chapter 2
		const chapterId = await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			return app.questController.currentChapter.id;
		});
		expect(chapterId).toBe("hall-of-fragments");

		await checkA11y(page, "legacys-end-app", {
			rules: { "color-contrast": { enabled: false } },
		});

		// Snapshot: Quest Chapter 2
		await expect(page).toHaveScreenshot("quest-chapter-2.png");

		// --- 4. Return to Hub ---
		await page.evaluate(async () => {
			const app = document.querySelector("legacys-end-app");
			await app.questController.returnToHub();
		});

		await expect(hub).toBeVisible();
		await checkA11y(page, "legacys-end-app", {
			rules: { "color-contrast": { enabled: false } },
		});

		// --- 5. Resume Quest ---
		// Re-find card and click Continue/Resume
		await expect(auraCard).toBeVisible();
		await auraCard.locator('wa-button[variant="brand"]').click(); // Should be "Continue" or similar brand button

		await expect(gameView).toBeVisible();

		// Verify still in Chapter 2
		const chapterIdResumed = await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			return app.questController.currentChapter.id;
		});
		expect(chapterIdResumed).toBe("hall-of-fragments");

		// --- 6. Complete Chapter 2 (Final) ---
		// Hack state to "collected"
		await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			app.questState.setHasCollectedItem(true);
		});

		await page.waitForTimeout(500);

		// Trigger Exit
		await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			const viewport = app.shadowRoot
				.querySelector("quest-view")
				.shadowRoot.querySelector("game-viewport");
			viewport.gameController.handleExitZoneReached();
		});

		// --- 7. Victory Screen ---
		const victoryScreen = gameView.locator("victory-screen");
		await expect(victoryScreen).toBeVisible({ timeout: 5000 });

		// Wait for rewards to be populated (Aura quest has 2 rewards)
		const rewardImages = victoryScreen.locator(".reward-img");
		await expect(rewardImages).toHaveCount(2);

		// Minimal wait for images
		await page.waitForTimeout(1000);

		// Wait a bit for animations to settle (pop-in delay)
		await page.waitForTimeout(1500);

		await checkA11y(page, "legacys-end-app", {
			rules: { "color-contrast": { enabled: false } },
		});

		// Snapshot: Victory Screen
		await expect(page).toHaveScreenshot("victory-screen.png");

		const isCompleted = await page.evaluate(() => {
			const app = document.querySelector("legacys-end-app");
			return app.questState.isQuestCompleted.get();
		});
		expect(isCompleted).toBe(true);

		// Return to Hub
		await victoryScreen.locator("wa-button").click({ force: true });
		await expect(hub).toBeVisible();
	});
});
