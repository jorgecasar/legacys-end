import { describe, expect, it, vi } from "vitest";
import { MacroCommand } from "./macro-command.js";

describe("MacroCommand", () => {
	it("should execute all commands in sequence", async () => {
		const cmd1 = {
			execute: vi.fn().mockResolvedValue({ success: true }),
			undo: vi.fn(),
			name: "cmd1",
		};
		const cmd2 = {
			execute: vi.fn().mockResolvedValue({ success: true }),
			undo: vi.fn(),
			name: "cmd2",
		};
		const macro = new MacroCommand({ commands: [cmd1, cmd2] });

		await macro.execute();

		expect(cmd1.execute).toHaveBeenCalled();
		expect(cmd2.execute).toHaveBeenCalled();
	});

	it("should rollback on failure", async () => {
		const cmd1 = {
			execute: vi.fn().mockResolvedValue({ success: true }),
			undo: vi.fn(),
			name: "cmd1",
		};
		const cmd2 = {
			execute: vi.fn().mockRejectedValue(new Error("fail")),
			undo: vi.fn(),
			name: "cmd2",
		};
		const macro = new MacroCommand({ commands: [cmd1, cmd2] });

		await expect(macro.execute()).rejects.toThrow("fail");

		expect(cmd1.undo).toHaveBeenCalled();
	});

	it("should undo all commands in reverse order", async () => {
		/** @type {number[]} */
		const order = [];
		const cmd1 = {
			execute: vi.fn().mockResolvedValue({ success: true }),
			undo: vi.fn().mockImplementation(() => order.push(1)),
			name: "cmd1",
		};
		const cmd2 = {
			execute: vi.fn().mockResolvedValue({ success: true }),
			undo: vi.fn().mockImplementation(() => order.push(2)),
			name: "cmd2",
		};

		const macro = new MacroCommand({ commands: [cmd1, cmd2] });
		await macro.execute();
		await macro.undo();

		expect(order).toEqual([2, 1]);
	});

	it("should check canExecute for all commands", () => {
		const cmd1 = { execute: vi.fn(), canExecute: () => true, name: "cmd1" };
		const cmd2 = { execute: vi.fn(), canExecute: () => false, name: "cmd2" };
		const macro = new MacroCommand({ commands: [cmd1, cmd2] });

		expect(macro.canExecute()).toBe(false);
	});
});
