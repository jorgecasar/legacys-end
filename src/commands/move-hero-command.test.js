import { beforeEach, describe, expect, it, vi } from "vitest";
import { MoveHeroCommand } from "./move-hero-command.js";

describe("MoveHeroCommand", () => {
	/** @type {any} */
	let mockGameState;
	/** @type {MoveHeroCommand} */
	let command;

	beforeEach(() => {
		mockGameState = {
			getState: vi.fn().mockReturnValue({
				heroPos: { x: 50, y: 50 },
				isPaused: false,
				isEvolving: false,
			}),
			setHeroPosition: vi.fn(),
		};
	});

	it("should move hero by delta", () => {
		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 0,
		});

		command.execute();

		expect(mockGameState.setHeroPosition).toHaveBeenCalledWith(55, 50);
	});

	it("should save previous position", () => {
		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 3,
		});

		command.execute();

		expect(command.previousPos).toEqual({ x: 50, y: 50 });
	});

	it("should undo move to previous position", () => {
		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 3,
		});

		command.execute();
		mockGameState.setHeroPosition.mockClear();

		command.undo();

		expect(mockGameState.setHeroPosition).toHaveBeenCalledWith(50, 50);
	});

	it("should not execute when paused", () => {
		mockGameState.getState.mockReturnValue({
			heroPos: { x: 50, y: 50 },
			isPaused: true,
			isEvolving: false,
		});

		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 0,
		});

		expect(command.canExecute()).toBe(false);
	});

	it("should not execute when evolving", () => {
		mockGameState.getState.mockReturnValue({
			heroPos: { x: 50, y: 50 },
			isPaused: false,
			isEvolving: true,
		});

		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 0,
		});

		expect(command.canExecute()).toBe(false);
	});

	it("should execute when not paused or evolving", () => {
		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 0,
		});

		expect(command.canExecute()).toBe(true);
	});

	it("should have correct metadata", () => {
		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: 5,
			dy: 3,
		});

		expect(command.name).toBe("MoveHero");
		expect(command.metadata).toEqual({ dx: 5, dy: 3 });
	});

	it("should handle negative deltas", () => {
		command = new MoveHeroCommand({
			gameState: mockGameState,
			dx: -5,
			dy: -3,
		});

		command.execute();

		expect(mockGameState.setHeroPosition).toHaveBeenCalledWith(45, 47);
	});

	it("should trigger onMove callback during execute", () => {
		const onMove = vi.fn();
		command = new MoveHeroCommand({
			gameState: mockGameState,
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
			gameState: mockGameState,
			dx: 5,
			dy: 0,
			onMove,
		});

		command.execute();
		onMove.mockClear();

		command.undo();

		expect(onMove).toHaveBeenCalled();
	});
});
