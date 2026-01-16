import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function exec(cmd) {
	try {
		return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
	} catch {
		return null;
	}
}

function getGzipSize(filePath) {
	const content = fs.readFileSync(filePath);
	return zlib.gzipSync(content).length;
}

function getLoC(dir) {
	const result = exec(`find ${dir} -name "*.js" | xargs wc -l`);
	if (!result) return 0;
	const match = result
		.trim()
		.split("\n")
		.pop()
		.match(/^\s*(\d+)\s+total/);
	return match ? parseInt(match[1], 10) : 0;
}

async function recordStats() {
	const hash = exec("git rev-parse --short HEAD").trim();
	console.log(`Recording stats for commit: ${hash}`);

	const metrics = {
		hash,
		timestamp: exec("git show -s --format=%ci HEAD").trim(),
		message: exec("git show -s --format=%s HEAD").trim(),
		project: {},
		bundle: {},
		tests: {},
	};

	const pkg = JSON.parse(
		fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
	);

	// Project Stats
	metrics.project.dependencies = Object.keys(pkg.dependencies || {}).length;
	metrics.project.devDependencies = Object.keys(
		pkg.devDependencies || {},
	).length;
	metrics.project.loc = getLoC(path.join(ROOT, "src"));

	const srcFiles = exec("find src -type f | wc -l");
	metrics.project.totalFiles = srcFiles ? parseInt(srcFiles.trim(), 10) : 0;

	const testFiles = exec(
		'find src -name "*.test.js" -o -name "*.spec.js" | wc -l',
	);
	metrics.project.testFiles = testFiles ? parseInt(testFiles.trim(), 10) : 0;

	// Bundle metrics (assuming build is already done)
	const distDir = path.join(ROOT, "dist");
	if (fs.existsSync(distDir)) {
		const jsFilesRaw = exec(`find ${distDir} -name "*.js"`);
		const jsFiles = jsFilesRaw
			? jsFilesRaw.trim().split("\n").filter(Boolean)
			: [];
		metrics.bundle.fileCount = jsFiles.length;
		metrics.bundle.totalRawSize = 0;
		metrics.bundle.totalGzipSize = 0;

		for (const file of jsFiles) {
			const stats = fs.statSync(file);
			metrics.bundle.totalRawSize += stats.size;
			metrics.bundle.totalGzipSize += getGzipSize(file);
		}
	}

	// Tests results (assuming test --reporter=json --outputFile=test-results.json is already done)
	const testResultPath = path.join(ROOT, "test-results.json");
	if (fs.existsSync(testResultPath)) {
		const testData = JSON.parse(fs.readFileSync(testResultPath, "utf8"));
		metrics.tests.total = testData.numTotalTests || 0;
		metrics.tests.passed = testData.numPassedTests || 0;
		metrics.tests.failed = testData.numFailedTests || 0;
	}

	// Update history
	const historyPath = path.join(ROOT, "bundle-history.jsonl");
	let history = [];
	if (fs.existsSync(historyPath)) {
		const raw = fs.readFileSync(historyPath, "utf8");
		history = raw
			.trim()
			.split("\n")
			.map((line) => JSON.parse(line));
	}

	// Remove existing if same hash to avoid duplicates
	const filteredHistory = history.filter((item) => item.hash !== hash);

	// Add at the end
	filteredHistory.push(metrics);

	const ndjson = filteredHistory.map((item) => JSON.stringify(item)).join("\n");
	fs.writeFileSync(historyPath, `${ndjson}\n`);
	console.log("Stats recorded in bundle-history.jsonl");
}

recordStats();
