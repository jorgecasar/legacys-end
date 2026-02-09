import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import {
	deps,
	exec,
	getCommitsInRange,
	getCommitsToAnalyze,
	getGzipSize,
	getLoC,
	parseArgs,
} from "./analyze-history.js";

describe("analyze-history (Node.js Test Runner)", () => {
	beforeEach(() => {
		mock.reset();
	});

	describe("exec", () => {
		it("should execute command and return output", () => {
			mock.method(deps, "execSync", () => "output\n");
			const result = exec("ls");
			assert.strictEqual(result, "output\n");
		});

		it("should return null on error", () => {
			mock.method(deps, "execSync", () => {
				throw new Error();
			});
			const result = exec("invalid");
			assert.strictEqual(result, null);
		});
	});

	describe("getGzipSize", () => {
		it("should return gzip size of a file", () => {
			mock.method(deps, "readFileSync", () => "content");
			mock.method(deps, "gzipSync", () => ({ length: 100 }));

			const size = getGzipSize("file.txt");
			assert.strictEqual(size, 100);
		});
	});

	describe("parseArgs", () => {
		it("should parse commit option", () => {
			const options = parseArgs(["--commit", "abc123"]);
			assert.strictEqual(options.commit, "abc123");
		});

		it("should parse range option", () => {
			const options = parseArgs(["--range", "abc..def"]);
			assert.strictEqual(options.range, "abc..def");
		});

		it("should parse force option", () => {
			const options = parseArgs(["--force"]);
			assert.strictEqual(options.force, true);
		});

		it("should parse limit option", () => {
			const options = parseArgs(["--limit", "10"]);
			assert.strictEqual(options.limit, 10);
		});

		it("should parse numeric argument as limit for backward compatibility", () => {
			const options = parseArgs(["50"]);
			assert.strictEqual(options.limit, 50);
		});
	});

	describe("getCommitsToAnalyze", () => {
		it("should return specific commit if provided", () => {
			const targets = getCommitsToAnalyze(
				{ commit: "abc" },
				["abc", "def"],
				new Set(),
			);
			assert.deepStrictEqual(targets, ["abc"]);
		});

		it("should return missing commits by default", () => {
			const targets = getCommitsToAnalyze(
				{},
				["abc", "def", "ghi"],
				new Set(["abc"]),
			);
			assert.deepStrictEqual(targets, ["def", "ghi"]);
		});

		it("should respect limit option", () => {
			const targets = getCommitsToAnalyze(
				{ limit: 1 },
				["abc", "def", "ghi"],
				new Set(),
			);
			assert.deepStrictEqual(targets, ["abc"]);
		});
	});
});
