import { beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterContextController } from "./character-context-controller.js";

describe("CharacterContextController", () => {
	/** @type {any} */
	let host;
	/** @type {CharacterContextController} */
	let controller;
	/** @type {any} */
	let characterProvider;
	/** @type {any} */
	let getStateMock;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};
		characterProvider = { setValue: vi.fn() };
		getStateMock = vi.fn();

		controller = new CharacterContextController(/** @type {any} */ (host), {
			characterProvider,
			getState: getStateMock,
		});
	});

	it("should initialize and add controller to host", () => {
		expect(host.addController).toHaveBeenCalledWith(controller);
	});

	describe("update", () => {
		it("should update suit context based on level and reward", () => {
			getStateMock.mockReturnValue({
				level: "level_1",
				chapterData: {
					hero: {
						image: "/assets/level_1/hero.png",
						reward: "/assets/level_1/hero-reward.png",
					},
				},
				isRewardCollected: false,
			});

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					suit: { image: "/assets/level_1/hero.png" },
				}),
			);
		});

		it("should update suit context with reward image when evolved", () => {
			getStateMock.mockReturnValue({
				level: "level_1",
				chapterData: {
					hero: {
						image: "/assets/level_1/hero.png",
						reward: "/assets/level_1/hero-reward.png",
					},
				},
				isRewardCollected: true,
			});

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					suit: { image: "/assets/level_1/hero-reward.png" },
				}),
			);
		});

		it("should update gear context when item is collected", () => {
			getStateMock.mockReturnValue({
				level: "level_2",
				chapterData: {
					reward: { image: "/assets/level_2/reward.png" },
				},
				hasCollectedItem: true,
			});

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					gear: { image: "/assets/level_2/reward.png" },
				}),
			);
		});

		it("should clear gear context when item is not collected", () => {
			getStateMock.mockReturnValue({
				level: "level_2",
				chapterData: {
					reward: { image: "/assets/level_2/reward.png" },
				},
				hasCollectedItem: false,
			});

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					gear: { image: null },
				}),
			);
		});

		it("should update power context based on hot switch state", () => {
			getStateMock.mockReturnValue({
				hotSwitchState: null,
				themeMode: "dark",
			});

			controller.hostUpdate();

			expect(characterProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					power: {
						effect: "glitch",
						intensity: "high",
					},
				}),
			);
		});
		it("should not crash if characterProvider is missing", () => {
			controller = new CharacterContextController(/** @type {any} */ (host), {
				getState: getStateMock,
			});

			getStateMock.mockReturnValue({ level: "1" });

			expect(() => controller.hostUpdate()).not.toThrow();
		});
	});
});
