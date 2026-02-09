/**
 * @vitest-environment node
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import zlib from "node:zlib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	exec,
	getCommitsInRange,
	getCommitsToAnalyze,
	getGzipSize,
	getLoC,
	parseArgs,
} from "./analyze-history.js";

vi.mock("node:child_process", () => ({
	execSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
	default: {
		readFileSync: vi.fn(),
		existsSync: vi.fn(),
		statSync: vi.fn(),
		writeFileSync: vi.fn(),
		appendFileSync: vi.fn(),
		rmSync: vi.fn(),
		copyFileSync: vi.fn(),
	},
}));

vi.mock("node:zlib", () => ({
	default: {
		gzipSync: vi.fn(() => ({ length: 100 })),
	},
}));

describe("analyze-history", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("exec", () => {
		it("should execute command and return output", () => {
			execSync.mockReturnValue("output\n");
			const result = exec("ls");
			expect(result).toBe("output\n");
		});

		it("should return null on error", () => {
			execSync.mockImplementation(() => {
				throw new Error();
			});
			const result = exec("invalid");
			expect(result).toBeNull();
		});
	});

	describe("getGzipSize", () => {
		it("should return gzip size of a file", () => {
			fs.readFileSync.mockReturnValue("content");
			const size = getGzipSize("file.txt");
			expect(size).toBe(100);
		});
	});

	describe("getLoC", () => {
		it("should return lines of code", () => {
			execSync.mockReturnValue("123\n");
			const loc = getLoC("src");
			expect(loc).toBe(123);
		});
	});

	describe("parseArgs", () => {
		it("should parse commit option", () => {
			const options = parseArgs(["--commit", "abc123"]);
			expect(options.commit).toBe("abc123");
		});

		it("should parse range option", () => {
			const options = parseArgs(["--range", "abc..def"]);
			expect(options.range).toBe("abc..def");
		});

		it("should parse force option", () => {
			const options = parseArgs(["--force"]);
			expect(options.force).toBe(true);
		});

		it("should parse limit option", () => {
			const options = parseArgs(["--limit", "10"]);
			expect(options.limit).toBe(10);
		});

		it("should parse numeric argument as limit for backward compatibility", () => {
			const options = parseArgs(["50"]);
			expect(options.limit).toBe(50);
		});
	});

	describe("getCommitsInRange", () => {
		it("should return inclusive range of commits", () => {
			execSync.mockReturnValueOnce("abc"); // startValid
			execSync.mockReturnValueOnce("def"); // endValid
			execSync.mockReturnValueOnce("ghi\ndef\n"); // git log result

			const commits = getCommitsInRange("abc..def");
			expect(commits).toEqual(["abc", "ghi", "def"]);
		});
	});

	describe("getCommitsToAnalyze", () => {
		it("should return specific commit if provided", () => {
			const targets = getCommitsToAnalyze(
				{ commit: "abc" },
				["abc", "def"],
				new Set(),
			);
			expect(targets).toEqual(["abc"]);
		});

		it("should return missing commits by default", () => {
			const targets = getCommitsToAnalyze(
				{},
				["abc", "def", "ghi"],
				new Set(["abc"]),
			);
			expect(targets).toEqual(["def", "ghi"]);
		});

		it("should respect limit option", () => {
			const targets = getCommitsToAnalyze(
				{ limit: 1 },
				["abc", "def", "ghi"],
				new Set(),
			);
			expect(targets).toEqual(["abc"]);
		});
	});
});
