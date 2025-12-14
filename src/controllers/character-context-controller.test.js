import { beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterContextController } from "./character-context-controller.js";

describe("CharacterContextController", () => {
	let host;
	let controller;
	let suitProvider;
	let gearProvider;
	let powerProvider;
	let masteryProvider;
	let getStateMock;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
		};
		suitProvider = { setValue: vi.fn() };
		gearProvider = { setValue: vi.fn() };
		powerProvider = { setValue: vi.fn() };
		masteryProvider = { setValue: vi.fn() };
		getStateMock = vi.fn();

		controller = new CharacterContextController(host, {
			suitProvider,
			gearProvider,
			powerProvider,
			masteryProvider,
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
				isRewardCollected: false,
			});

			controller.update();

			expect(suitProvider.setValue).toHaveBeenCalledWith({
				image: "/assets/level_1/hero.png",
			});
		});

		it("should update suit context with reward image when evolved", () => {
			getStateMock.mockReturnValue({
				level: "level_1",
				isRewardCollected: true,
			});

			controller.update();

			expect(suitProvider.setValue).toHaveBeenCalledWith({
				image: "/assets/level_1/hero-reward.png",
			});
		});

		it("should update gear context when item is collected", () => {
			getStateMock.mockReturnValue({
				level: "level_2",
				hasCollectedItem: true,
			});

			controller.update();

			expect(gearProvider.setValue).toHaveBeenCalledWith({
				image: "/assets/level_2/reward.png",
			});
		});

		it("should clear gear context when item is not collected", () => {
			getStateMock.mockReturnValue({
				level: "level_2",
				hasCollectedItem: false,
			});

			controller.update();

			expect(gearProvider.setValue).toHaveBeenCalledWith({
				image: null,
			});
		});

		it("should update power context based on hot switch state", () => {
			getStateMock.mockReturnValue({
				hotSwitchState: "legacy",
				themeMode: "dark",
			});

			controller.update();

			expect(powerProvider.setValue).toHaveBeenCalledWith({
				effect: "glitch",
				intensity: "high",
			});
		});
	});
});
