import assert from "node:assert";
import path from "node:path";
import { describe, it, mock } from "node:test";
import { prune } from "./prune-skills.js";

describe("prune-skills.js", () => {
	it("should exit if phase is unknown", () => {
		const mockConsoleError = mock.fn();
		const mockExit = mock.fn();

		prune("invalid-phase", {
			console: { ...console, error: mockConsoleError },
			process: { ...process, exit: mockExit, env: { NODE_ENV: "production" } },
		});

		assert.strictEqual(mockConsoleError.mock.callCount(), 1);
		assert.ok(
			mockConsoleError.mock.calls[0].arguments[0].includes("Unknown phase"),
		);
		assert.strictEqual(mockExit.mock.callCount(), 1);
	});

	it("should skip if skills directory does not exist", () => {
		const mockFs = {
			existsSync: mock.fn(() => false),
		};
		const mockConsoleLog = mock.fn();

		prune("planning", {
			fs: mockFs,
			console: { ...console, log: mockConsoleLog },
			process: { env: { NODE_ENV: "test" } },
			skillsDir: "/tmp/skills",
		});

		assert.strictEqual(mockFs.existsSync.mock.callCount(), 1);
		assert.ok(mockConsoleLog.mock.calls[0].arguments[0].includes("Skipping"));
	});

	it("should remove skills not in the keep list for 'planning'", () => {
		const mockFs = {
			existsSync: mock.fn(() => true),
			readdirSync: mock.fn(() => [
				"project-context",
				"webawesome",
				"unknown-skill",
			]),
			rmSync: mock.fn(),
		};
		const mockConsoleLog = mock.fn();

		prune("planning", {
			fs: mockFs,
			path: path,
			console: { ...console, log: mockConsoleLog },
			process: { env: { NODE_ENV: "test" } },
			skillsDir: "/tmp/skills",
		});

		// Planning keeps: project-context, task-creator, agentic-design-patterns, github-ops, rulesync
		// Should remove: webawesome, unknown-skill

		assert.strictEqual(mockFs.rmSync.mock.callCount(), 2);

		const removedPaths = mockFs.rmSync.mock.calls.map((c) => c.arguments[0]);
		assert.ok(removedPaths.some((p) => p.endsWith("webawesome")));
		assert.ok(removedPaths.some((p) => p.endsWith("unknown-skill")));
		assert.ok(!removedPaths.some((p) => p.endsWith("project-context")));
	});

	it("should remove skills not in the keep list for 'development'", () => {
		const mockFs = {
			existsSync: mock.fn(() => true),
			readdirSync: mock.fn(() => [
				"project-context",
				"webawesome",
				"unknown-skill",
				"github-ops",
			]),
			rmSync: mock.fn(),
		};

		prune("development", {
			fs: mockFs,
			path: path,
			console: { ...console, log: () => {} },
			process: { env: { NODE_ENV: "test" } },
			skillsDir: "/tmp/skills",
		});

		// Development keeps: project-context, lit-component, git-flow, conventional-commits, webawesome, coverage-evolution, skill-mutation-testing, rulesync
		// Should remove: unknown-skill, github-ops (github-ops is in planning but not development list)

		assert.strictEqual(mockFs.rmSync.mock.callCount(), 2);

		const removedPaths = mockFs.rmSync.mock.calls.map((c) => c.arguments[0]);
		assert.ok(removedPaths.some((p) => p.endsWith("unknown-skill")));
		assert.ok(removedPaths.some((p) => p.endsWith("github-ops")));
		assert.ok(!removedPaths.some((p) => p.endsWith("webawesome")));
	});

	it("should handle error reading directory", () => {
		const mockFs = {
			existsSync: mock.fn(() => true),
			readdirSync: mock.fn(() => {
				throw new Error("Read error");
			}),
		};
		const mockConsoleError = mock.fn();

		prune("planning", {
			fs: mockFs,
			console: { ...console, error: mockConsoleError, log: () => {} },
			process: { env: { NODE_ENV: "test" } },
			skillsDir: "/tmp/skills",
		});

		assert.strictEqual(mockConsoleError.mock.callCount(), 1);
		assert.ok(
			mockConsoleError.mock.calls[0].arguments[0].includes(
				"Error reading skills directory",
			),
		);
	});
});
