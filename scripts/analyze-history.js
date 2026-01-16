import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMP_DIR = path.join(ROOT, ".history-temp");

function exec(cmd, cwd = ROOT) {
	try {
		return execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
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

async function analyzeCommit(hash) {
	console.log(`\n--- Analyzing commit: ${hash} ---`);

	// Cleanup previous
	if (fs.existsSync(TEMP_DIR)) {
		exec(`git worktree remove -f ${TEMP_DIR}`);
	}

	// Create worktree
	exec(`git worktree add ${TEMP_DIR} ${hash}`);

	const metrics = {
		hash,
		timestamp: exec(`git show -s --format=%ci ${hash}`).trim(),
		message: exec(`git show -s --format=%s ${hash}`).trim(),
		project: {},
		bundle: {},
		tests: {},
	};

	try {
		const pkgPath = path.join(TEMP_DIR, "package.json");
		if (!fs.existsSync(pkgPath)) {
			throw new Error("No package.json found");
		}
		const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

		// Project Stats
		metrics.project.dependencies = Object.keys(pkg.dependencies || {}).length;
		metrics.project.devDependencies = Object.keys(
			pkg.devDependencies || {},
		).length;
		metrics.project.loc = getLoC(path.join(TEMP_DIR, "src"));

		// Count files
		const srcFiles = exec(`find ${path.join(TEMP_DIR, "src")} -type f | wc -l`);
		metrics.project.totalFiles = srcFiles ? parseInt(srcFiles.trim(), 10) : 0;

		const testFiles = exec(
			`find ${path.join(TEMP_DIR, "src")} -name "*.test.js" -o -name "*.spec.js" | wc -l`,
		);
		metrics.project.testFiles = testFiles ? parseInt(testFiles.trim(), 10) : 0;

		// Build
		console.log("Installing dependencies...");
		exec("npm install --prefer-offline --no-audit --no-fund", TEMP_DIR);

		console.log("Building...");
		exec("npm run build", TEMP_DIR);

		// Bundle metrics
		const distDir = path.join(TEMP_DIR, "dist");
		if (fs.existsSync(distDir)) {
			const jsFilesRaw = exec(`find ${distDir} -name "*.js"`, TEMP_DIR);
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

		// Tests (if script exists)
		if (pkg.scripts && pkg.scripts.test) {
			console.log("Running tests...");
			const testResultPath = path.join(TEMP_DIR, "test-results.json");
			// We try to use vitest json reporter if possible
			exec(
				`npm test -- --reporter=json --outputFile=${testResultPath} --run`,
				TEMP_DIR,
			);

			if (fs.existsSync(testResultPath)) {
				const testData = JSON.parse(fs.readFileSync(testResultPath, "utf8"));
				metrics.tests.total = testData.numTotalTests || 0;
				metrics.tests.passed = testData.numPassedTests || 0;
				metrics.tests.failed = testData.numFailedTests || 0;
			}
		}
	} catch (err) {
		console.error(`Error analyzing ${hash}:`, err.message);
	} finally {
		exec(`git worktree remove -f ${TEMP_DIR}`);
	}

	return metrics;
}

async function main() {
	const limit = parseInt(process.argv[2]) || 5;
	const logRaw = exec(`git log --oneline --reverse -n ${limit}`);
	if (!logRaw) {
		console.error("Failed to get git log");
		return;
	}
	const log = logRaw.trim().split("\n");
	const outputPath = path.join(ROOT, "bundle-history.jsonl");

	// Load existing hashes to skip them
	const existingHashes = new Set();
	if (fs.existsSync(outputPath)) {
		const raw = fs.readFileSync(outputPath, "utf8");
		raw
			.trim()
			.split("\n")
			.filter(Boolean)
			.forEach((line) => {
				try {
					const item = JSON.parse(line);
					if (item.hash) {
						existingHashes.add(item.hash);
					}
				} catch {
					// Ignore malformed lines
				}
			});
	}

	for (const line of log) {
		const hash = line.split(" ")[0];
		if (existingHashes.has(hash)) {
			console.log(`Skipping already analyzed commit: ${hash}`);
			continue;
		}

		const metrics = await analyzeCommit(hash);
		if (metrics && metrics.hash) {
			fs.appendFileSync(outputPath, `${JSON.stringify(metrics)}\n`);
			console.log(`Saved metrics for ${hash}`);
		}
	}

	console.log(`\nDone! History updated in ${outputPath}`);
}

main();
