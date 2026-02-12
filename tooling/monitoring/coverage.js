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

	const summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, "utf8"));
	const total = summary.total;

	let configContent = fs.readFileSync(VITE_CONFIG_PATH, "utf8");

	// Extract current thresholds using regex (simple but effective for this structure)
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
		const metricMatch = thresholdBlock.match(new RegExp(`${metric}: (\\d+)`));
		if (metricMatch) {
			const currentMin = parseInt(metricMatch[1], 10);
			const actual = total[metric].pct;

			if (actual >= currentMin + DIFFERENTIAL) {
				const newMin = Math.floor(actual);
				console.log(
					`Updating ${metric} threshold: ${currentMin} -> ${newMin} (Actual: ${actual}%)`,
				);
				newThresholdBlock = newThresholdBlock.replace(
					new RegExp(`${metric}: \\d+`),
					`${metric}: ${newMin}`,
				);
				updated = true;
			}
		}
	}

	if (updated) {
		configContent = configContent.replace(thresholdMatch[1], newThresholdBlock);
		fs.writeFileSync(VITE_CONFIG_PATH, configContent);
		console.log("vite.config.js updated with new coverage thresholds.");
	} else {
		console.log("No significant coverage improvement detected (less than 5%).");
	}
}

manageCoverage().catch(console.error);
