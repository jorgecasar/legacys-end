import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeGameStateService } from "../services/fakes/fake-game-state-service.js";
import { MoveHeroCommand } from "./move-hero-command.js";

describe("MoveHeroCommand", () => {
	/** @type {FakeGameStateService} */
	let fakeGameState;
	/** @type {MoveHeroCommand} */
	let command;

	beforeEach(() => {
		fakeGameState = new FakeGameStateService();
		fakeGameState.heroPos.set({ x: 50, y: 50 });
	});

	it("should move hero by delta", () => {
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
		});

		command.execute();

		expect(fakeGameState.heroPos.get()).toEqual({ x: 55, y: 50 });
	});

	it("should save previous position", () => {
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 3,
		});

		command.execute();

		expect(command.previousPos).toEqual({ x: 50, y: 50 });
	});

	it("should undo move to previous position", () => {
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 3,
		});

		command.execute();
		// State is {55, 53}

		command.undo();

		expect(fakeGameState.heroPos.get()).toEqual({ x: 50, y: 50 });
	});

	it("should not execute when paused", () => {
		fakeGameState.isPaused.set(true);

		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
		});

		expect(command.canExecute()).toBe(false);
	});

	it("should not execute when evolving", () => {
		fakeGameState.isEvolving.set(true);

		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
		});

		expect(command.canExecute()).toBe(false);
	});

	it("should execute when not paused or evolving", () => {
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
		});

		expect(command.canExecute()).toBe(true);
	});

	it("should have correct metadata", () => {
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 3,
		});

		expect(command.name).toBe("MoveHero");
		expect(command.metadata).toEqual({ dx: 5, dy: 3 });
	});

	it("should handle negative deltas", () => {
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: -5,
			dy: -3,
		});

		command.execute();

		expect(fakeGameState.heroPos.get()).toEqual({ x: 45, y: 47 });
	});

	it("should trigger onMove callback during execute", () => {
		const onMove = vi.fn();
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
			onMove,
		});

		command.execute();

		expect(onMove).toHaveBeenCalled();
	});

	it("should trigger onMove callback during undo", () => {
		const onMove = vi.fn();
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
			onMove,
		});

		command.execute();
		onMove.mockClear();

		command.undo();

		expect(onMove).toHaveBeenCalled();
	});

	it("should emit HERO_MOVED event on execute", () => {
		const eventBus = { emit: vi.fn() };
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
			eventBus: /** @type {any} */ (eventBus),
		});

		command.execute();

		expect(eventBus.emit).toHaveBeenCalledWith("hero-moved", {
			x: 55,
			y: 50,
			hasCollectedItem: false,
		});
	});

	it("should emit HERO_MOVED event on undo", () => {
		const eventBus = { emit: vi.fn() };
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 5,
			dy: 0,
			eventBus: /** @type {any} */ (eventBus),
		});

		command.execute();
		eventBus.emit.mockClear();

		command.undo();

		expect(eventBus.emit).toHaveBeenCalledWith("hero-moved", {
			x: 50,
			y: 50,
			hasCollectedItem: false,
		});
	});

	it("should clamp x and y to 0", () => {
		fakeGameState.heroPos.set({ x: 2, y: 2 });
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: -10,
			dy: -10,
		});

		command.execute();

		expect(fakeGameState.heroPos.get()).toEqual({ x: 0, y: 0 });
	});

	it("should clamp x and y to 100", () => {
		fakeGameState.heroPos.set({ x: 98, y: 98 });
		command = new MoveHeroCommand({
			gameState: fakeGameState,
			dx: 10,
			dy: 10,
		});

		command.execute();

		expect(fakeGameState.heroPos.get()).toEqual({ x: 100, y: 100 });
	});
});
