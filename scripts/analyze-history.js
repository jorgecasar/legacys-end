import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMP_DIR = path.join(ROOT, ".history-temp");

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
	try {
		exec(`git worktree remove -f ${TEMP_DIR}`);
	} catch {}

	// Force remove directory if it still exists (e.g. not a valid worktree)
	if (fs.existsSync(TEMP_DIR)) {
		fs.rmSync(TEMP_DIR, { recursive: true, force: true });
	}

	// Always prune stale worktrees to avoid "already registered" errors
	exec("git worktree prune");

	// Create worktree
	const result = exec(`git worktree add ${TEMP_DIR} ${hash}`);
	if (result === null && !fs.existsSync(TEMP_DIR)) {
		console.error(`Failed to create worktree for ${hash}`);
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

		// Merge current build-related devDependencies for consistent builds
		const currentPkg = JSON.parse(
			fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
		);
		const tempPkgPath = path.join(TEMP_DIR, "package.json");
		const tempPkg = JSON.parse(fs.readFileSync(tempPkgPath, "utf8"));

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

		for (const pkg of buildPackages) {
			if (currentPkg.devDependencies?.[pkg]) {
				tempPkg.devDependencies = tempPkg.devDependencies || {};
				tempPkg.devDependencies[pkg] = currentPkg.devDependencies[pkg];
			}
		}

		fs.writeFileSync(tempPkgPath, JSON.stringify(tempPkg, null, 2));

		exec("npm install --prefer-offline --no-audit --no-fund", TEMP_DIR);

		// Merge current vite.config.js build settings while preserving test config
		const currentViteConfig = path.join(ROOT, "vite.config.js");
		const tempViteConfig = path.join(TEMP_DIR, "vite.config.js");

		if (fs.existsSync(currentViteConfig)) {
			// Read both configs
			const currentConfig = fs.readFileSync(currentViteConfig, "utf8");

			// If temp doesn't have vite.config, just copy it
			if (!fs.existsSync(tempViteConfig)) {
				fs.copyFileSync(currentViteConfig, tempViteConfig);
				console.log("Using current vite.config.js for build");
			} else {
				// Preserve original test config by removing test section from current config
				const configWithoutTests = currentConfig.replace(
					/test:\s*\{[\s\S]*?\},\s*(?=\};\s*\}\);)/,
					"",
				);
				fs.writeFileSync(tempViteConfig, configWithoutTests);
				console.log(
					"Using current build config, preserving original test config",
				);
			}
		}

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
		if (pkg.scripts?.test) {
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
	} finally {
		exec(`git worktree remove -f ${TEMP_DIR}`);
	}

	return metrics;
}

/**
 * Parse CLI arguments
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		commit: null,
		range: null,
		force: false,
		limit: null,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help" || arg === "-h") {
			console.log(HELP_TEXT);
			process.exit(0);
		} else if (arg === "--commit" && args[i + 1]) {
			options.commit = args[++i];
		} else if (arg === "--range" && args[i + 1]) {
			options.range = args[++i];
		} else if (arg === "--force") {
			options.force = true;
		} else if (arg === "--limit" && args[i + 1]) {
			options.limit = parseInt(args[++i], 10);
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
function getCommitsInRange(range) {
	// Convert "start..end" to "start^..end" to include start commit
	// Handle both "start..end" and "start^..end" formats
	let gitRange = range;
	if (range.includes("..") && !range.includes("^")) {
		const [start, end] = range.split("..");
		gitRange = `${start}^..${end}`;
	}

	const result = exec(`git log --format=%h --reverse ${gitRange}`);
	if (!result) {
		console.error(`Failed to get commits in range: ${range}`);
		return [];
	}
	return result.trim().split("\n").filter(Boolean);
}

/**
 * Get commits to analyze based on options
 */
function getCommitsToAnalyze(options, allCommits, analyzedHashes) {
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

async function main() {
	const options = parseArgs();

	const logRaw = exec("git log --format=%h --reverse");
	if (!logRaw) {
		console.error("Failed to get git log");
		return;
	}
	// All commits in the current branch
	const allCommits = logRaw.trim().split("\n");
	const allCommitsSet = new Set(allCommits);

	const outputPath = path.join(ROOT, "bundle-history.jsonl");

	// Load existing history and Prune stale entries
	let history = [];
	if (fs.existsSync(outputPath)) {
		const raw = fs.readFileSync(outputPath, "utf8");
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
		fs.writeFileSync(outputPath, ndjson ? `${ndjson}\n` : "");
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

	// Track which commits we're updating for --force
	const updatedHashes = new Set();

	for (const hash of targets) {
		// Skip if already analyzed and not forcing
		if (!options.force && analyzedHashes.has(hash)) {
			console.log(
				`Skipping ${hash} (already analyzed, use --force to re-analyze)`,
			);
			continue;
		}

		const metrics = await analyzeCommit(hash);
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
				fs.appendFileSync(outputPath, `${JSON.stringify(metrics)}\n`);
				console.log(`Saved metrics for ${hash}`);
			}
		}
	}

	// If using --force, rewrite the entire file once at the end
	if (options.force && updatedHashes.size > 0) {
		// Sort by original commit order (chronological)
		const commitOrder = new Map(allCommits.map((h, i) => [h, i]));
		validHistory.sort((a, b) => {
			const orderA = commitOrder.get(a.hash) ?? Number.MAX_SAFE_INTEGER;
			const orderB = commitOrder.get(b.hash) ?? Number.MAX_SAFE_INTEGER;
			return orderA - orderB;
		});

		const ndjson = validHistory.map((item) => JSON.stringify(item)).join("\n");
		fs.writeFileSync(outputPath, `${ndjson}\n`);
		console.log(`\nUpdated ${updatedHashes.size} commits in total`);
	}

	console.log(`\nDone! History updated in ${outputPath}`);
}

main();
