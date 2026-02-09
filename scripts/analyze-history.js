import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMP_DIR = path.join(ROOT, ".history-temp");
const BUN = "/Users/jorgecasar/.bun/bin/bun";

// Wrapper for dependencies to allow mocking in Node.js test runner
export const deps = {
	execSync,
	readFileSync: fs.readFileSync,
	writeFileSync: fs.writeFileSync,
	appendFileSync: fs.appendFileSync,
	existsSync: fs.existsSync,
	statSync: fs.statSync,
	rmSync: fs.rmSync,
	copyFileSync: fs.copyFileSync,
	gzipSync: zlib.gzipSync,
};

const HELP_TEXT = `
Usage: node scripts/analyze-history.js [options]

Analyze git commit history and record bundle size, test metrics, and project stats.

Options:
  --commit <hash>        Analyze a specific commit
  --range <start>..<end> Analyze a range of commits (inclusive of both start and end)
  --force                Force re-analysis of existing commits (shows summary of changes)
  --limit <n>            Limit the number of commits to analyze
  --help, -h             Show this help message
  [number]               Backward compatible: limit number of commits (same as --limit)

Examples:
  # Analyze all missing commits
  node scripts/analyze-history.js

  # Analyze last 50 commits (backward compatible)
  node scripts/analyze-history.js 50

  # Analyze specific commit
  node scripts/analyze-history.js --commit abc123
  node scripts/analyze-history.js --commit HEAD

  # Analyze range of commits (inclusive)
  node scripts/analyze-history.js --range abc123..def456

  # Re-analyze commits with new metrics
  node scripts/analyze-history.js --force --commit abc123
  node scripts/analyze-history.js --force --range abc123..def456

  # Limit analysis to 100 commits
  node scripts/analyze-history.js --limit 100

Output:
  Results are written to bundle-history.jsonl in NDJSON format.
  Each line contains metrics for one commit including:
  - Project stats (dependencies, LOC, file counts)
  - Bundle metrics (file count, raw size, gzip size)
  - Test results (total, passed, failed)

Notes:
  - Without --force: New commits are appended immediately after analysis
  - With --force: All commits are analyzed first, then file is rewritten once
  - Range format: start..end includes BOTH start and end commits
  - The script creates a temporary worktree for each commit analysis
`;

export function exec(cmd, cwd = ROOT) {
	try {
		return deps.execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
	} catch {
		return null;
	}
}

export function getGzipSize(filePath) {
	const content = deps.readFileSync(filePath);
	return deps.gzipSync(content).length;
}

export function getLoC(dir) {
	// More robust way to get total lines of code for JS files
	const result = exec(`find ${dir} -name "*.js" -exec cat {} + | wc -l`);
	if (!result) return 0;
	return parseInt(result.trim(), 10) || 0;
}

export async function analyzeCommit(hash, tempDir) {
	console.log(`\n--- Analyzing commit: ${hash} ---`);

	// Checkout the specific commit in the temp directory
	try {
		exec(`git checkout -f ${hash}`, tempDir);
	} catch (err) {
		console.error(`Failed to checkout ${hash}: ${err.message}`);
		return { hash };
	}

	const metrics = {
		hash,
		timestamp: exec(`git show -s --format=%ci ${hash}`)?.trim() || "",
		message: exec(`git show -s --format=%s ${hash}`)?.trim() || "",
		project: {},
		bundle: {},
		tests: {},
	};

	try {
		const pkgPath = path.join(tempDir, "package.json");
		if (!deps.existsSync(pkgPath)) {
			throw new Error("No package.json found");
		}
		const pkg = JSON.parse(deps.readFileSync(pkgPath, "utf8"));

		// Project Stats
		metrics.project.dependencies = Object.keys(pkg.dependencies || {}).length;
		metrics.project.devDependencies = Object.keys(
			pkg.devDependencies || {},
		).length;
		metrics.project.loc = getLoC(path.join(tempDir, "src"));

		// Count files
		const srcFiles = exec(`find ${path.join(tempDir, "src")} -type f | wc -l`);
		metrics.project.totalFiles = srcFiles ? parseInt(srcFiles.trim(), 10) : 0;

		const testFiles = exec(
			`find ${path.join(tempDir, "src")} -name "*.test.js" -o -name "*.spec.js" | wc -l`,
		);
		metrics.project.testFiles = testFiles ? parseInt(testFiles.trim(), 10) : 0;

		// Build
		console.log("Installing dependencies...");

		// Merge current build-related devDependencies for consistent builds
		const currentPkg = JSON.parse(
			deps.readFileSync(path.join(ROOT, "package.json"), "utf8"),
		);
		const tempPkgPath = path.join(tempDir, "package.json");
		const tempPkg = JSON.parse(deps.readFileSync(tempPkgPath, "utf8"));

		// Build-related packages to merge
		const buildPackages = [
			"vite",
			"@lit-labs/rollup-plugin-minify-html-literals",
			"rollup-plugin-visualizer",
			"vite-imagetools",
			"vite-plugin-babel",
			"vite-plugin-image-optimizer",
			"@babel/plugin-proposal-decorators",
		];

		for (const pkgName of buildPackages) {
			if (currentPkg.devDependencies?.[pkgName]) {
				tempPkg.devDependencies = tempPkg.devDependencies || {};
				tempPkg.devDependencies[pkgName] = currentPkg.devDependencies[pkgName];
			}
		}

		deps.writeFileSync(tempPkgPath, JSON.stringify(tempPkg, null, 2));

		exec(`${BUN} install`, tempDir);

		// Use current vite.config.js only if commit doesn't have one
		const currentViteConfig = path.join(ROOT, "vite.config.js");
		const tempViteConfig = path.join(tempDir, "vite.config.js");

		if (
			!deps.existsSync(tempViteConfig) &&
			deps.existsSync(currentViteConfig)
		) {
			deps.copyFileSync(currentViteConfig, tempViteConfig);
			console.log("Using current vite.config.js for build (missing in commit)");
		} else if (deps.existsSync(tempViteConfig)) {
			console.log("Using commit's original vite.config.js");
		}

		console.log("Building...");
		exec(`${BUN} run build`, tempDir);

		// Bundle metrics
		const distDir = path.join(tempDir, "dist");
		if (deps.existsSync(distDir)) {
			const jsFilesRaw = exec(`find ${distDir} -name "*.js"`, tempDir);
			const jsFiles = jsFilesRaw
				? jsFilesRaw.trim().split("\n").filter(Boolean)
				: [];
			metrics.bundle.fileCount = jsFiles.length;
			metrics.bundle.totalRawSize = 0;
			metrics.bundle.totalGzipSize = 0;

			for (const file of jsFiles) {
				const stats = deps.statSync(file);
				metrics.bundle.totalRawSize += stats.size;
				metrics.bundle.totalGzipSize += getGzipSize(file);
			}
		}

		// Tests (if script exists)
		if (pkg.scripts?.test) {
			console.log("Running tests...");
			const testResultPath = path.join(tempDir, "test-results.json");
			// We try to use vitest json reporter if possible
			exec(
				`${BUN} run test -- --reporter=json --outputFile=${testResultPath} --run`,
				tempDir,
			);

			if (deps.existsSync(testResultPath)) {
				const testData = JSON.parse(deps.readFileSync(testResultPath, "utf8"));
				metrics.tests.total = testData.numTotalTests || 0;
				metrics.tests.passed = testData.numPassedTests || 0;
				metrics.tests.failed = testData.numFailedTests || 0;
			} else {
				// Test script exists but no results file
				metrics.tests.total = 0;
				metrics.tests.passed = 0;
				metrics.tests.failed = 0;
			}
		} else {
			// No test script
			metrics.tests.total = 0;
			metrics.tests.passed = 0;
			metrics.tests.failed = 0;
		}
	} catch (err) {
		console.error(`Error analyzing ${hash}:`, err.message);
	}

	return metrics;
}

/**
 * Parse CLI arguments
 */
export function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		commit: null,
		range: null,
		force: false,
		limit: null,
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--help" || arg === "-h") {
			console.log(HELP_TEXT);
			process.exit(0);
		} else if (arg === "--commit" && argv[i + 1]) {
			options.commit = argv[++i];
		} else if (arg === "--range" && argv[i + 1]) {
			options.range = argv[++i];
		} else if (arg === "--force") {
			options.force = true;
		} else if (arg === "--limit" && argv[i + 1]) {
			options.limit = parseInt(argv[++i], 10);
		} else if (!arg.startsWith("--")) {
			// Backward compatibility: first numeric arg is limit
			const num = parseInt(arg, 10);
			if (!Number.isNaN(num)) {
				options.limit = num;
			}
		}
	}

	return options;
}

/**
 * Get commits in a range (inclusive of both start and end)
 */
export function getCommitsInRange(range) {
	const parts = range.split(/\.{2,3}/);
	if (parts.length < 2) return [range];

	const start = parts[0].trim().replace(/\^$/, "");
	const end = parts[1].trim();

	// Check if commits exist
	const startValid = exec(`git rev-parse --verify ${start}`);
	const endValid = exec(`git rev-parse --verify ${end}`);

	if (!startValid || !endValid) {
		console.error(`Invalid commits in range: ${range}`);
		return [];
	}

	const result = exec(`git log --format=%h --reverse ${start}..${end}`);
	if (result === null) {
		console.error(`Failed to get commits in range: ${range}`);
		return [];
	}

	const commits = result.trim().split("\n").filter(Boolean);
	// Inclusively add the start commit
	return [start, ...commits];
}

/**
 * Get commits to analyze based on options
 */
export function getCommitsToAnalyze(options, allCommits, analyzedHashes) {
	if (options.commit) {
		console.log(`Analyzing specific commit: ${options.commit}`);
		return [options.commit];
	}

	if (options.range) {
		console.log(`Analyzing commit range: ${options.range}`);
		return getCommitsInRange(options.range);
	}

	// Default: missing commits
	const missingCommits = allCommits.filter((hash) => !analyzedHashes.has(hash));

	if (options.limit) {
		return missingCommits.slice(0, options.limit);
	}

	return missingCommits;
}

export async function main() {
	const options = parseArgs();

	const logRaw = exec("git log --format=%h --reverse");
	if (!logRaw) {
		console.error("Failed to get git log");
		return;
	}
	// All commits in the current branch
	const allCommits = logRaw.trim().split("\n");
	const allCommitsSet = new Set(allCommits);

	const outputPath = path.join(ROOT, "public", "bundle-history.jsonl");

	// Load existing history and Prune stale entries
	let history = [];
	if (deps.existsSync(outputPath)) {
		const raw = deps.readFileSync(outputPath, "utf8");
		history = raw
			.trim()
			.split("\n")
			.filter(Boolean)
			.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return null;
				}
			})
			.filter((item) => item?.hash && item?.timestamp);
	}

	// Filter out commits that no longer exist in the branch
	const validHistory = history.filter((item) => allCommitsSet.has(item.hash));

	// Determine if we need to rewrite the file (pruning occurred)
	if (validHistory.length !== history.length) {
		console.log(
			`Pruning ${history.length - validHistory.length} stale entries...`,
		);
		const ndjson = validHistory.map((item) => JSON.stringify(item)).join("\n");
		deps.writeFileSync(outputPath, ndjson ? `${ndjson}\n` : "");
	} else {
		console.log("No stale entries found.");
	}

	// Identify analyzed commits
	const analyzedHashes = new Set(validHistory.map((item) => item.hash));

	// Get commits to analyze based on CLI options
	const targets = getCommitsToAnalyze(options, allCommits, analyzedHashes);

	if (targets.length === 0) {
		console.log("History is up to date.");
		return;
	}

	console.log(`Analyzing ${targets.length} commits...`);

	// Setup persistent worktree
	console.log(`\nSetting up persistent worktree in ${TEMP_DIR}...`);
	try {
		exec(`git worktree remove -f ${TEMP_DIR}`);
	} catch {}
	if (deps.existsSync(TEMP_DIR)) {
		deps.rmSync(TEMP_DIR, { recursive: true, force: true });
	}
	exec("git worktree prune");
	exec(`git worktree add ${TEMP_DIR} HEAD`);

	// Track which commits we're updating for --force
	const updatedHashes = new Set();

	try {
		for (const hash of targets) {
			// Skip if already analyzed and not forcing
			if (!options.force && analyzedHashes.has(hash)) {
				console.log(
					`Skipping ${hash} (already analyzed, use --force to re-analyze)`,
				);
				continue;
			}

			const metrics = await analyzeCommit(hash, TEMP_DIR);
			if (metrics?.timestamp) {
				if (options.force) {
					// Track for batch rewrite at the end
					updatedHashes.add(hash);
					// Store in validHistory for final rewrite
					const existingIndex = validHistory.findIndex(
						(item) => item.hash === hash,
					);
					if (existingIndex !== -1) {
						const oldMetrics = validHistory[existingIndex];
						validHistory[existingIndex] = metrics;

						// Show summary immediately for this commit
						const changes = [];

						// Bundle size changes
						if (
							oldMetrics.bundle?.totalGzipSize !== metrics.bundle?.totalGzipSize
						) {
							const oldSize = oldMetrics.bundle?.totalGzipSize || 0;
							const newSize = metrics.bundle?.totalGzipSize || 0;
							const diff = newSize - oldSize;
							const pct = oldSize ? ((diff / oldSize) * 100).toFixed(1) : "N/A";
							changes.push(
								`bundle: ${oldSize} → ${newSize} (${diff > 0 ? "+" : ""}${pct}%)`,
							);
						}

						// Test changes
						if (oldMetrics.tests?.total !== metrics.tests?.total) {
							changes.push(
								`tests: ${oldMetrics.tests?.total || 0} → ${metrics.tests?.total || 0}`,
							);
						}

						if (changes.length > 0) {
							console.log(`📊 ${hash}: ${changes.join(", ")}`);
						} else {
							console.log(`📊 ${hash}: no changes detected`);
						}
					} else {
						validHistory.push(metrics);
						console.log(`📊 ${hash}: newly analyzed`);
					}
				} else {
					// Append immediately for new commits
					validHistory.push(metrics);
					deps.appendFileSync(outputPath, `${JSON.stringify(metrics)}\n`);
					console.log(`Saved metrics for ${hash}`);
				}

				// Always update the .json file for the UI after each commit
				const jsonPath = path.join(ROOT, "public", "bundle-history.json");
				deps.writeFileSync(jsonPath, JSON.stringify(validHistory, null, 2));

				// If using --force, rewrite the .jsonl after each update to keep it consistent
				if (options.force) {
					// Sort by original commit order (chronological)
					const commitOrder = new Map(allCommits.map((h, i) => [h, i]));
					validHistory.sort((a, b) => {
						const orderA = commitOrder.get(a.hash) ?? Number.MAX_SAFE_INTEGER;
						const orderB = commitOrder.get(b.hash) ?? Number.MAX_SAFE_INTEGER;
						return orderA - orderB;
					});

					const ndjson = validHistory
						.map((item) => JSON.stringify(item))
						.join("\n");
					deps.writeFileSync(outputPath, `${ndjson}\n`);
				}
			}
		}

		if (options.force && updatedHashes.size > 0) {
			console.log(`\nUpdated ${updatedHashes.size} commits in total`);
		}
	} finally {
		console.log(`\nCleaning up worktree...`);
		exec(`git worktree remove -f ${TEMP_DIR}`);

		// Also update a standard .json file (array) for the UI
		const jsonPath = path.join(ROOT, "bundle-history.json");
		deps.writeFileSync(jsonPath, JSON.stringify(validHistory, null, 2));
		console.log(`Updated UI data in ${jsonPath}`);
	}

	console.log(`\nDone! History updated in ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}
