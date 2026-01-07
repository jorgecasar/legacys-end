import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandBus } from "./command-bus.js";

describe("CommandBus", () => {
	/** @type {CommandBus} */
	let commandBus;

	beforeEach(() => {
		commandBus = new CommandBus({ maxHistorySize: 5 });
	});

	describe("execute", () => {
		it("should execute a command successfully", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
			};

			const result = await commandBus.execute(command);

			expect(result.success).toBe(true);
			expect(command.execute).toHaveBeenCalled();
		});

		it("should run middleware before execution", async () => {
			const middleware = vi.fn().mockReturnValue(true);
			commandBus.use(middleware);

			const command = {
				name: "TestCommand",
				execute: vi.fn(),
			};

			await commandBus.execute(command);

			expect(middleware).toHaveBeenCalledWith(command);
		});

		it("should cancel execution if middleware returns false", async () => {
			const middleware = vi.fn().mockReturnValue(false);
			commandBus.use(middleware);

			const command = {
				name: "TestCommand",
				execute: vi.fn(),
			};

			const result = await commandBus.execute(command);

			expect(result.success).toBe(false);
			expect(result.reason).toBe("cancelled by middleware");
			expect(command.execute).not.toHaveBeenCalled();
		});

		it("should check canExecute before execution", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				canExecute: vi.fn().mockReturnValue(false),
			};

			const result = await commandBus.execute(command);

			expect(result.success).toBe(false);
			expect(result.reason).toBe("canExecute returned false");
			expect(command.execute).not.toHaveBeenCalled();
		});

		it("should add command to history if it has undo", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command);

			expect(commandBus.getHistory()).toHaveLength(1);
			expect(commandBus.getHistory()[0]).toBe(command);
		});

		it("should not add command to history if it has no undo", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
			};

			await commandBus.execute(command);

			expect(commandBus.getHistory()).toHaveLength(0);
		});

		it("should handle async commands", async () => {
			const command = {
				name: "AsyncCommand",
				execute: vi.fn().mockResolvedValue(undefined),
			};

			const result = await commandBus.execute(command);

			expect(result.success).toBe(true);
		});

		it("should handle command errors", async () => {
			const error = new Error("Command failed");
			const command = {
				name: "FailingCommand",
				execute: vi.fn().mockRejectedValue(error),
			};

			const result = await commandBus.execute(command);

			expect(result.success).toBe(false);
			expect(result.error).toBe(error);
		});

		it("should clear undo stack on new command", async () => {
			const command1 = {
				name: "Command1",
				execute: vi.fn(),
				undo: vi.fn(),
			};
			const command2 = {
				name: "Command2",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command1);
			await commandBus.undo();
			expect(commandBus.canRedo()).toBe(true);

			await commandBus.execute(command2);
			expect(commandBus.canRedo()).toBe(false);
		});
	});

	describe("undo", () => {
		it("should undo last command", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command);
			const result = await commandBus.undo();

			expect(result).toBe(true);
			expect(command.undo).toHaveBeenCalled();
			expect(commandBus.getHistory()).toHaveLength(0);
			expect(commandBus.getUndoStack()).toHaveLength(1);
		});

		it("should return false if no commands to undo", async () => {
			const result = await commandBus.undo();
			expect(result).toBe(false);
		});

		it("should handle undo errors", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn().mockRejectedValue(new Error("Undo failed")),
			};

			await commandBus.execute(command);
			const result = await commandBus.undo();

			expect(result).toBe(false);
			// Command should be back in history
			expect(commandBus.getHistory()).toHaveLength(1);
		});
	});

	describe("redo", () => {
		it("should redo last undone command", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command);
			await commandBus.undo();

			command.execute.mockClear();
			const result = await commandBus.redo();

			expect(result).toBe(true);
			expect(command.execute).toHaveBeenCalled();
			expect(commandBus.getHistory()).toHaveLength(1);
			expect(commandBus.getUndoStack()).toHaveLength(0);
		});

		it("should return false if no commands to redo", async () => {
			const result = await commandBus.redo();
			expect(result).toBe(false);
		});

		it("should handle redo errors", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command);
			await commandBus.undo();

			command.execute.mockRejectedValue(new Error("Redo failed"));
			const result = await commandBus.redo();

			expect(result).toBe(false);
			// Command should be back in undo stack
			expect(commandBus.getUndoStack()).toHaveLength(1);
		});
	});

	describe("history management", () => {
		it("should respect maxHistorySize", async () => {
			for (let i = 0; i < 10; i++) {
				await commandBus.execute({
					name: `Command${i}`,
					execute: vi.fn(),
					undo: vi.fn(),
				});
			}

			expect(commandBus.getHistory()).toHaveLength(5);
		});

		it("should clear history and undo stack", async () => {
			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command);
			await commandBus.undo();

			commandBus.clear();

			expect(commandBus.getHistory()).toHaveLength(0);
			expect(commandBus.getUndoStack()).toHaveLength(0);
		});
	});

	describe("middleware", () => {
		it("should allow unregistering middleware", async () => {
			const middleware = vi.fn().mockReturnValue(true);
			const unregister = commandBus.use(middleware);

			const command = {
				name: "TestCommand",
				execute: vi.fn(),
			};

			await commandBus.execute(command);
			expect(middleware).toHaveBeenCalledTimes(1);

			unregister();
			middleware.mockClear();

			await commandBus.execute(command);
			expect(middleware).not.toHaveBeenCalled();
		});

		it("should run multiple middleware in order", async () => {
			/** @type {number[]} */
			const order = [];
			const middleware1 = vi.fn(() => {
				order.push(1);
				return true;
			});
			const middleware2 = vi.fn(() => {
				order.push(2);
				return true;
			});

			commandBus.use(middleware1);
			commandBus.use(middleware2);

			await commandBus.execute({
				name: "TestCommand",
				execute: vi.fn(),
			});

			expect(order).toEqual([1, 2]);
		});
	});

	describe("canUndo and canRedo", () => {
		it("should return correct canUndo status", async () => {
			expect(commandBus.canUndo()).toBe(false);

			await commandBus.execute({
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			});

			expect(commandBus.canUndo()).toBe(true);
		});

		it("should return correct canRedo status", async () => {
			expect(commandBus.canRedo()).toBe(false);

			const command = {
				name: "TestCommand",
				execute: vi.fn(),
				undo: vi.fn(),
			};

			await commandBus.execute(command);
			await commandBus.undo();

			expect(commandBus.canRedo()).toBe(true);
		});
	});

	describe("Recording", () => {
		it("should record commands when active", async () => {
			const command = { name: "TestCommand", execute: vi.fn() };
			commandBus.startRecording();
			await commandBus.execute(command);
			const recorded = commandBus.stopRecording();

			expect(recorded).toHaveLength(1);
			expect(recorded[0]).toBe(command);
			expect(commandBus.isRecording()).toBe(false);
		});

		it("should not record commands when inactive", async () => {
			const command = { name: "TestCommand", execute: vi.fn() };
			await commandBus.execute(command);
			const recorded = commandBus.stopRecording();

			expect(recorded).toHaveLength(0);
		});

		it("should clear recorded commands on startRecording", async () => {
			const command = { name: "TestCommand", execute: vi.fn() };
			commandBus.startRecording();
			await commandBus.execute(command);
			commandBus.startRecording(); // Should clear
			const recorded = commandBus.stopRecording();

			expect(recorded).toHaveLength(0);
		});
	});
});
