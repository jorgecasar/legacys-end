import assert from "node:assert";
import { EventEmitter } from "node:events";
import { mock, test } from "node:test";
import { extractLastJSON, runGeminiCLI, sleep } from "./run-cli.js";

test("Gemini CLI Wrapper", async (t) => {
	const mockSpawn = mock.fn();
	const mockSleep = mock.fn(async () => {}); // Mock sleep to resolve immediately
	// Silence console logs and process.stdout during these tests
	const mockConsoleLog = mock.method(console, "log", () => {});
	const mockConsoleWarn = mock.method(console, "warn", () => {});
	const mockConsoleError = mock.method(console, "error", () => {});
	const mockStdoutWrite = mock.method(process.stdout, "write", () => {});

	t.beforeEach(() => {
		mockSpawn.mock.resetCalls();
		mockSleep.mock.resetCalls();
		mockConsoleLog.mock.resetCalls();
		mockConsoleWarn.mock.resetCalls();
		mockConsoleError.mock.resetCalls();
		mockStdoutWrite.mock.resetCalls();
	});

	t.after(() => {
		mockConsoleLog.mock.restore();
		mockConsoleWarn.mock.restore();
		mockConsoleError.mock.restore();
		mockStdoutWrite.mock.restore();
	});

	await t.test("extractLastJSON should parse nested JSON", () => {
		const input = 'some noise {"a":1} more noise {"b":2}';
		const result = extractLastJSON(input);
		assert.deepStrictEqual(result, { b: 2 });
	});

	await t.test("sleep should resolve after delay", async () => {
		const start = Date.now();
		await sleep(10);
		const end = Date.now();
		assert.ok(end - start >= 10);
	});

	await t.test("should execute CLI and parse JSON output", async () => {
		const mockChild = new EventEmitter();
		mockChild.stdin = { write: () => {}, end: () => {} };
		mockChild.stdout = new EventEmitter();
		mockChild.kill = mock.fn();

		mockSpawn.mock.mockImplementation(() => {
			setTimeout(() => {
				const output = JSON.stringify({
					usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
					response: "Success",
				});
				mockChild.stdout.emit("data", Buffer.from(output));
				mockChild.emit("close", 0);
			}, 10);
			return mockChild;
		});

		const result = await runGeminiCLI(
			"test prompt",
			{ modelType: "flash" },
			{ spawn: mockSpawn, sleep: mockSleep },
		);

		assert.strictEqual(result.inputTokens, 10);
		assert.strictEqual(result.outputTokens, 20);
		assert.strictEqual(result.response, "Success");
	});

	await t.test("should handle CLI errors and detect quota", async () => {
		const mockChild = new EventEmitter();
		mockChild.stdin = { write: () => {}, end: () => {} };
		mockChild.stdout = new EventEmitter();
		mockChild.kill = mock.fn();

		mockSpawn.mock.mockImplementation(() => {
			setTimeout(() => {
				// Simulate quota error output
				mockChild.stdout.emit(
					"data",
					Buffer.from("429 Quota exceeded. reset after 1s"),
				);
				mockChild.emit("close", 1);
			}, 10);
			return mockChild;
		});

		try {
			await runGeminiCLI(
				"fail",
				{ modelType: "flash" },
				{ spawn: mockSpawn, sleep: mockSleep },
			);
			assert.fail("Should have thrown");
		} catch (e) {
			assert.strictEqual(e.isQuota, true);
		}
	});

	await t.test("should retry on rate limit (quota)", async () => {
		const mockChild = new EventEmitter();
		mockChild.stdin = { write: () => {}, end: () => {} };
		mockChild.stdout = new EventEmitter();
		mockChild.kill = mock.fn();

		let attempt = 0;
		mockSpawn.mock.mockImplementation(() => {
			attempt++;
			setTimeout(() => {
				if (attempt === 1) {
					mockChild.stdout.emit(
						"data",
						Buffer.from("Quota exceeded. reset after 0s"),
					);
					mockChild.emit("close", 1);
				} else {
					mockChild.stdout.emit(
						"data",
						JSON.stringify({ response: "Retry Success" }),
					);
					mockChild.emit("close", 0);
				}
			}, 10);
			return mockChild;
		});

		const result = await runGeminiCLI(
			"retry",
			{ modelType: "flash" },
			{ spawn: mockSpawn, sleep: mockSleep },
		);
		assert.strictEqual(result.response, "Retry Success");
		assert.strictEqual(mockSpawn.mock.callCount(), 2);
		assert.strictEqual(mockSleep.mock.callCount(), 1); // Should have slept once
	});

	await t.test("should handle zero tokens gracefully", async () => {
		const mockChild = new EventEmitter();
		mockChild.stdin = { write: () => {}, end: () => {} };
		mockChild.stdout = new EventEmitter();
		mockChild.kill = mock.fn();

		mockSpawn.mock.mockImplementation(() => {
			setTimeout(() => {
				const output = JSON.stringify({
					// No usageMetadata
					response: "Success",
				});
				mockChild.stdout.emit("data", Buffer.from(output));
				mockChild.emit("close", 0);
			}, 10);
			return mockChild;
		});

		const result = await runGeminiCLI(
			"test",
			{ modelType: "flash" },
			{ spawn: mockSpawn, sleep: mockSleep },
		);
		assert.strictEqual(result.inputTokens, 0);
		assert.strictEqual(result.outputTokens, 0);
	});

	await t.test("should handle tokens in stats.models", async () => {
		const mockChild = new EventEmitter();
		mockChild.stdin = { write: () => {}, end: () => {} };
		mockChild.stdout = new EventEmitter();
		mockChild.kill = mock.fn();

		mockSpawn.mock.mockImplementation(() => {
			setTimeout(() => {
				const output = JSON.stringify({
					stats: {
						models: {
							gemini: { tokens: { input: 5, candidates: 5 } },
						},
					},
				});
				mockChild.stdout.emit("data", Buffer.from(output));
				mockChild.emit("close", 0);
			}, 10);
			return mockChild;
		});

		const result = await runGeminiCLI(
			"test",
			{ modelType: "flash" },
			{ spawn: mockSpawn, sleep: mockSleep },
		);
		assert.strictEqual(result.inputTokens, 5);
		assert.strictEqual(result.outputTokens, 5);
	});

	await t.test("should throw if inputTokenBudget is exceeded", async () => {
		const mockSpawn = mock.fn();
		const prompt = "a".repeat(400); // ~100 tokens
		try {
			await runGeminiCLI(
				prompt,
				{ inputTokenBudget: 50 },
				{ spawn: mockSpawn, sleep: mockSleep },
			);
			assert.fail("Should have thrown");
		} catch (e) {
			assert.match(e.message, /Input token budget exceeded/);
		}
		assert.strictEqual(mockSpawn.mock.callCount(), 0);
	});

	await t.test("should proceed if within inputTokenBudget", async () => {
		const mockChild = new EventEmitter();
		mockChild.stdin = { write: () => {}, end: () => {} };
		mockChild.stdout = new EventEmitter();
		mockChild.kill = mock.fn();

		const mockSpawn = mock.fn(() => {
			setTimeout(() => {
				mockChild.stdout.emit(
					"data",
					Buffer.from(JSON.stringify({ response: "ok" })),
				);
				mockChild.emit("close", 0);
			}, 10);
			return mockChild;
		});

		const prompt = "a".repeat(40); // ~10 tokens
		await runGeminiCLI(
			prompt,
			{ inputTokenBudget: 50 },
			{ spawn: mockSpawn, sleep: mockSleep },
		);
		assert.strictEqual(mockSpawn.mock.callCount(), 1);
	});
});
