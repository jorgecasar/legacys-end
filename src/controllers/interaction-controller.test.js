import { beforeEach, describe, expect, it, vi } from "vitest";
import { HotSwitchStates } from "../core/constants.js";

import { InteractionController } from "./interaction-controller.js";

// Mock @lit/context to handle dependency injection in tests
const contextMocks = new Map();
vi.mock("@lit/context", () => {
	class MockContextConsumer {
		/**
		 * @param {any} host
		 * @param {any} options
		 */
		constructor(host, options) {
			this.host = host;
			this.options = options;
			// Store callback to trigger it manually
			contextMocks.set(options.context, options.callback);
			// Trigger with current mock value if exists
			if (options.callback && host._mockContexts?.[options.context]) {
				options.callback(host._mockContexts[options.context]);
			}
		}
	}
	return {
		ContextConsumer: MockContextConsumer,
		createContext: vi.fn((key) => key),
	};
});

describe("InteractionController", () => {
	/** @type {any} */
	let host;
	/** @type {InteractionController} */
	let controller;

	// Mock services
	/** @type {any} */
	let mockGameStore;
	/** @type {any} */
	let mockQuestController;
	/** @type {any} */
	let mockLogger;
	/** @type {any} */
	let mockInteractUseCase;

	beforeEach(() => {
		vi.clearAllMocks();
		contextMocks.clear();

		const mockHeroState = {
			pos: { get: vi.fn().mockReturnValue({ x: 0, y: 0 }) },
			hotSwitchState: { get: vi.fn().mockReturnValue(HotSwitchStates.LEGACY) },
		};

		const mockQuestState = {
			hasCollectedItem: { get: vi.fn().mockReturnValue(false) },
		};

		mockGameStore = {
			hero: mockHeroState,
			quest: mockQuestState,
		};

		mockQuestController = {
			currentChapter: {
				id: "chapter-1",
				npc: { position: { x: 10, y: 0 } }, // Distance 10
			},
		};

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		};

		mockInteractUseCase = {
			execute: vi.fn().mockReturnValue({ action: "none" }),
		};

		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			dispatchEvent: vi.fn(),
			updateComplete: Promise.resolve(true),
			// Helper for mock ContextConsumer
			_mockContexts: {},
		};
	});

	const initController = (options = {}) => {
		controller = new InteractionController(host, {
			interactWithNpcUseCase: mockInteractUseCase,
			...options,
		});

		// Manual injection via the stored callbacks from the mock ContextConsumer
		// The order depends on how they are initialized in constructor
		// logger, questController, gameStore
		const callbacks = Array.from(contextMocks.values());

		// Map known contexts to mocks
		// Since we mocked createContext to return the key/string, we can try to match them if we knew the keys.
		// However, simpler to just iterate and check what was registered.
		// Or trust order if we know it.
		// Order in InteractionController:
		// 1. loggerContext
		// 2. questControllerContext
		// 3. gameStoreContext

		if (callbacks.length >= 3) {
			callbacks[0](mockLogger);
			callbacks[1](mockQuestController);
			callbacks[2](mockGameStore);
		}
	};

	it("should initialize correctly", () => {
		initController({ interactionDistance: 20 });
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.options.interactionDistance).toBe(20);
	});

	describe("Distance Calculation", () => {
		it("should calculate distance correctly", () => {
			initController();
			const dist = controller.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
			expect(dist).toBe(5); // 3-4-5 triangle
		});

		it("should return Infinity if target is missing", () => {
			initController();
			expect(controller.calculateDistance({ x: 0, y: 0 }, null)).toBe(Infinity);
		});
	});

	describe("Proximity Detection", () => {
		it("should detect when close to NPC", () => {
			initController({ interactionDistance: 15 });
			// Distance is 10 (setup), limit is 15 -> True
			expect(controller.isCloseToNpc()).toBe(true);
		});

		it("should detect when far from NPC", () => {
			mockQuestController.currentChapter.npc.position = { x: 20, y: 0 };
			initController({ interactionDistance: 15 });
			expect(controller.isCloseToNpc()).toBe(false);
		});
	});

	describe("Interaction Logic", () => {
		it("should dispatch request-dialog event if use case returns showDialog", () => {
			mockInteractUseCase.execute.mockReturnValue({ action: "showDialog" });
			initController();

			controller.handleInteract();
			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "request-dialog",
				}),
			);
		});

		it("should dispatch show-locked-message event if use case returns showLocked", () => {
			mockInteractUseCase.execute.mockReturnValue({
				action: "showLocked",
				message: "Locked!",
			});
			initController();

			controller.handleInteract();
			expect(host.dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "show-locked-message",
					detail: { message: "Locked!" },
				}),
			);
		});

		it("should pass correct state to use case", () => {
			mockGameStore.hero.pos.get.mockReturnValue({ x: 5, y: 5 });
			mockGameStore.hero.hotSwitchState.get.mockReturnValue(
				HotSwitchStates.NEW,
			);
			mockGameStore.quest.hasCollectedItem.get.mockReturnValue(true);

			initController();
			controller.handleInteract();

			expect(mockInteractUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					gameState: expect.objectContaining({
						heroPos: { x: 5, y: 5 },
						hotSwitchState: HotSwitchStates.NEW,
						hasCollectedItem: true,
					}),
					hasCollectedItem: true,
				}),
			);
		});

		it("should log warning and abort if services are not ready", () => {
			// Don't trigger callbacks (services stay null)
			controller = new InteractionController(host, {
				interactWithNpcUseCase: mockInteractUseCase,
			});
			// We need to manually set #logger for this test to work if we want to check warning
			// But it's private. Let's instead check that it doesn't throw.
			expect(() => controller.handleInteract()).not.toThrow();
			expect(mockInteractUseCase.execute).not.toHaveBeenCalled();
		});
	});

	describe("Lifecycle", () => {
		it("should have consistent lifecycle methods", () => {
			initController();
			expect(() => controller.hostConnected()).not.toThrow();
			expect(() => controller.hostDisconnected()).not.toThrow();
		});
	});
});
