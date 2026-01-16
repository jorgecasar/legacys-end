import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameBootstrapper } from "../../core/game-bootstrapper.js";
import { LegacysEndApp } from "./LegacysEndApp.js";

// Mock dependencies if needed, or use real ones for full integration.
// For true integration test, we want to try using as much real code as possible,
// but JSDOM might lack some APIs (like LocalStorage, which we have an adapter for).

describe("LegacysEndApp Integration", () => {
	/** @type {LegacysEndApp} */
	let element;

	beforeEach(async () => {
		// Verify LegacysEndApp is defined
		if (!customElements.get("legacys-end-app")) {
			customElements.define("legacys-end-app", LegacysEndApp);
		}

		// Spy on GameBootstrapper.bootstrap to verify it's called
		// But let it run through to test wiring
		vi.spyOn(GameBootstrapper.prototype, "bootstrap");

		element = /** @type {LegacysEndApp} */ (
			document.createElement("legacys-end-app")
		);
		document.body.appendChild(element);
		// Wait for updates
		await element.updateComplete;
		await element.gameInitialized;
	});

	afterEach(() => {
		document.body.removeChild(element);
		vi.restoreAllMocks();
	});

	it("initializes game stack correctly on startup", async () => {
		// Initialization is async in initGame() called from constructor
		// We need to wait for it. The component doesn't emit an event, so we might need a small wait or rely on side effects.
		// However, in our previous refactor, initGame sets properties.

		// Wait for potential async ops
		await new Promise((resolve) => setTimeout(resolve, 100));
		await element.updateComplete;

		// 1. Verify Bootstrapper was called
		expect(GameBootstrapper.prototype.bootstrap).toHaveBeenCalledWith(element);

		// 2. Verify Services are attached to the App (host)
		expect(element.gameState).toBeDefined();
		expect(element.progressService).toBeDefined();
		expect(element.questLoader).toBeDefined();
		expect(element.router).toBeDefined();
		expect(element.questController).toBeDefined();

		// 3. Verify specific wiring state
		// e.g. GameState should have access to logger via DI (not easily checkable from outside unless we spy logger)
		expect(element.gameState.logger).toBeDefined(); // Since we added it to public property in step 4792
		expect(element.progressService.logger).toBeDefined();

		// 4. Verify initial state
		// 4. Verify initial state
		expect(/** @type {any} */ (element).isLoading).toBe(false);
		// Wait, initGame is async. We waited 100ms.
		// in LegacysEndApp.js constructor sets isLoading = true.
		// initGame calls syncSessionState which sets isLoading from sessionManager.
		// SessionManager initial state might be loading?
		// Let's verify with .toBeDefined() or check actual logic.
		// But first fix property name.
		expect(/** @type {any} */ (element).isLoading).toBeDefined();
	});
});
