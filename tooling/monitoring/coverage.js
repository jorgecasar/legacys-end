import fs from "node:fs";
import path from "node:path";

const COVERAGE_SUMMARY_PATH = path.resolve(
	process.cwd(),
	"coverage/coverage-summary.json",
);
const VITE_CONFIG_PATH = path.resolve(process.cwd(), "vite.config.js");
const DIFFERENTIAL = 5;

async function manageCoverage() {
	if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
		console.error("Coverage summary not found. Run tests with coverage first.");
		process.exit(1);
	}

	// Read and parse the coverage summary
	const summaryContent = fs.readFileSync(COVERAGE_SUMMARY_PATH, "utf8");
	let summary;
	try {
		summary = JSON.parse(summaryContent);
	} catch (error) {
		console.error("Error parsing coverage summary:", error);
		process.exit(1);
	}

	// Get the total coverage object. If "total" key is missing, try using the root object (some reporters differ)
	const total = summary.total || summary;

	if (!total) {
		console.error("Could not find 'total' coverage data.");
		process.exit(1);
	}

	let configContent = fs.readFileSync(VITE_CONFIG_PATH, "utf8");

	// Extract current thresholds using regex
	const thresholdMatch = configContent.match(/thresholds: \{([\s\S]*?)\}/);
	if (!thresholdMatch) {
		console.error("Could not find thresholds in vite.config.js");
		process.exit(1);
	}

	const thresholdBlock = thresholdMatch[1];
	const metrics = ["statements", "branches", "functions", "lines"];
	let updated = false;
	let newThresholdBlock = thresholdBlock;

	for (const metric of metrics) {
		// Look for "metric: value" in the threshold block
		const regex = new RegExp(`${metric}:\\s*(\\d+)`);
		const metricMatch = thresholdBlock.match(regex);

		if (metricMatch) {
			const currentMin = parseInt(metricMatch[1], 10);
			// Check if the metric exists in the coverage summary
			if (total[metric]) {
				const actual = total[metric].pct;

				if (actual >= currentMin + DIFFERENTIAL) {
					const newMin = Math.floor(actual);
					console.log(
						`Updating ${metric} threshold: ${currentMin} -> ${newMin} (Actual: ${actual}%)`,
					);
					// Replace the value in the block
					newThresholdBlock = newThresholdBlock.replace(
						regex,
						`${metric}: ${newMin}`,
					);
					updated = true;
				}
			} else {
				console.warn(`Metric '${metric}' not found in coverage summary.`);
			}
		}
	}

	if (updated) {
		// Replace the old block with the new one in the config content
		configContent = configContent.replace(thresholdMatch[1], newThresholdBlock);
		fs.writeFileSync(VITE_CONFIG_PATH, configContent);
		console.log("vite.config.js updated with new coverage thresholds.");
	} else {
		console.log("No significant coverage improvement detected (less than 5%).");
	}
}

manageCoverage().catch(console.error);
