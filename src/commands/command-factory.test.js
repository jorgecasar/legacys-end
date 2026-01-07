import { describe, expect, it, vi } from "vitest";
import { CommandFactory } from "./command-factory.js";

describe("CommandFactory", () => {
	it("should register and create commands", () => {
		const MockCommand = vi.fn().mockImplementation(function (params) {
			this.params = params;
			this.name = "MockCommand";
		});
		const dependencies = { service: { id: 1 } };
		const factory = new CommandFactory(dependencies);

		factory.register("Mock", MockCommand);
		const command = factory.create("Mock", { x: 10 });

		expect(MockCommand).toHaveBeenCalledWith({
			service: { id: 1 },
			x: 10,
		});
		expect(command.name).toBe("MockCommand");
	});

	it("should throw error for unregistered commands", () => {
		const factory = new CommandFactory();
		expect(() => factory.create("Unknown")).toThrow(
			'Command "Unknown" not registered in factory',
		);
	});

	it("should create a sequence of commands", () => {
		const MockCommand = vi.fn().mockImplementation(function (params) {
			this.params = params;
			this.name = params.name || "Mock";
		});
		const factory = new CommandFactory();
		factory.register("Mock", MockCommand);

		const specs = [
			{ name: "Mock", metadata: { name: "cmd1" } },
			{ name: "Mock", metadata: { name: "cmd2" } },
		];

		const commands = factory.createSequence(specs);

		expect(commands).toHaveLength(2);
		expect(commands[0].name).toBe("cmd1");
		expect(commands[1].name).toBe("cmd2");
	});
});
