import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameService } from "./game-service.js";

describe("GameService", () => {
	/** @type {GameService} */
	let gameService;
	/** @type {any} */
	let options;

	beforeEach(() => {
		options = {
			setLevel: vi.fn(),
			giveItem: vi.fn(),
			teleport: vi.fn(),
			getState: vi.fn().mockReturnValue({ level: 1 }),
			setTheme: vi.fn(),
			startQuest: vi.fn(),
			completeQuest: vi.fn(),
			completeChapter: vi.fn(),
			returnToHub: vi.fn(),
			listQuests: vi.fn().mockReturnValue([]),
			getProgress: vi.fn().mockReturnValue({}),
			resetProgress: vi.fn(),
		};
		gameService = new GameService(options);
	});

	it("should call setLevel callback", () => {
		gameService.setChapter("chapter-1");
		expect(options.setLevel).toHaveBeenCalledWith("chapter-1");
	});

	it("should call giveItem callback", () => {
		gameService.giveItem();
		expect(options.giveItem).toHaveBeenCalled();
	});

	it("should call teleport callback", () => {
		gameService.teleport(10, 20);
		expect(options.teleport).toHaveBeenCalledWith(10, 20);
	});

	it("should call getState callback and return state", () => {
		const consoleSpy = vi.spyOn(console, "table").mockImplementation(() => {});
		const state = gameService.getState();
		expect(options.getState).toHaveBeenCalled();
		expect(state).toEqual({ level: 1 });
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should return empty object if getState is not provided", () => {
		gameService = new GameService({});
		const state = gameService.getState();
		expect(state).toEqual({});
	});

	it("should call setTheme callback", () => {
		gameService.setTheme("dark");
		expect(options.setTheme).toHaveBeenCalledWith("dark");
	});

	it("should call startQuest callback", () => {
		gameService.startQuest("quest-1");
		expect(options.startQuest).toHaveBeenCalledWith("quest-1");
	});

	it("should call completeQuest callback", () => {
		gameService.completeQuest();
		expect(options.completeQuest).toHaveBeenCalled();
	});

	it("should call completeChapter callback", () => {
		gameService.completeChapter();
		expect(options.completeChapter).toHaveBeenCalled();
	});

	it("should call returnToHub callback", () => {
		gameService.returnToHub();
		expect(options.returnToHub).toHaveBeenCalled();
	});

	it("should call listQuests callback and return quests", () => {
		const quests = gameService.listQuests();
		expect(options.listQuests).toHaveBeenCalled();
		expect(quests).toEqual([]);
	});

	it("should return empty array if listQuests is not provided", () => {
		gameService = new GameService({});
		const quests = gameService.listQuests();
		expect(quests).toEqual([]);
	});

	it("should call getProgress callback and return progress", () => {
		const consoleSpy = vi.spyOn(console, "table").mockImplementation(() => {});
		const progress = gameService.getProgress();
		expect(options.getProgress).toHaveBeenCalled();
		expect(progress).toEqual({});
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should return empty object if getProgress is not provided", () => {
		gameService = new GameService({});
		const progress = gameService.getProgress();
		expect(progress).toEqual({});
	});

	it("should call resetProgress callback when confirmed", () => {
		const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
		gameService.resetProgress();
		expect(confirmSpy).toHaveBeenCalled();
		expect(options.resetProgress).toHaveBeenCalled();
		confirmSpy.mockRestore();
	});

	it("should not call resetProgress callback when cancelled", () => {
		const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
		gameService.resetProgress();
		expect(confirmSpy).toHaveBeenCalled();
		expect(options.resetProgress).not.toHaveBeenCalled();
		confirmSpy.mockRestore();
	});

	it("should handle missing callbacks gracefully", () => {
		gameService = new GameService({});
		expect(() => gameService.setChapter("test")).not.toThrow();
		expect(() => gameService.giveItem()).not.toThrow();
		expect(() => gameService.teleport(0, 0)).not.toThrow();
	});
});
