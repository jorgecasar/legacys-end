async function loadData() {
	try {
		const response = await fetch("/bundle-history.json");
		if (!response.ok) {
			throw new Error(`Failed to fetch: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error("Error loading data:", error);
		return [];
	}
}

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / k ** i).toFixed(dm)) + " " + sizes[i];
}

function initBundleChart(data) {
	const ctx = document.getElementById("bundleSizeChart").getContext("2d");

	// Filter entries that have bundle data
	const bundleData = data.filter((d) => d.bundle?.totalRawSize);

	const labels = bundleData.map((d) => d.timestamp.split(" ")[0]);
	const rawSizes = bundleData.map((d) => d.bundle.totalRawSize);
	const gzipSizes = bundleData.map((d) => d.bundle.totalGzipSize);

	new Chart(ctx, {
		type: "line",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Raw Size",
					data: rawSizes,
					borderColor: "#38bdf8",
					backgroundColor: "rgba(56, 189, 248, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
					pointHoverRadius: 6,
				},
				{
					label: "Gzip Size",
					data: gzipSizes,
					borderColor: "#818cf8",
					backgroundColor: "rgba(129, 140, 248, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
					pointHoverRadius: 6,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: "index",
				intersect: false,
			},
			plugins: {
				legend: {
					labels: { color: "#f1f5f9" },
				},
				tooltip: {
					callbacks: {
						label: (context) => {
							let label = context.dataset.label || "";
							if (label) label += ": ";
							if (context.parsed.y !== null) {
								label += formatBytes(context.parsed.y);
							}
							return label;
						},
						afterBody: (context) => {
							const index = context[0].dataIndex;
							const item = bundleData[index];
							return [
								"",
								`Commit: ${item.hash}`,
								`Msg: ${item.message.substring(0, 50)}${item.message.length > 50 ? "..." : ""}`,
							];
						},
					},
				},
			},
			scales: {
				y: {
					ticks: {
						color: "#94a3b8",
						callback: (value) => formatBytes(value, 0),
					},
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
				x: {
					ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 45 },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
			},
		},
	});
}

function initTestsChart(data) {
	const ctx = document.getElementById("testResultsChart").getContext("2d");

	// Filter entries that have tests data
	const testData = data.filter((d) => d.tests && d.tests.total > 0);

	const labels = testData.map((d) => d.timestamp.split(" ")[0]);
	const passed = testData.map((d) => d.tests.passed);
	const failed = testData.map((d) => d.tests.failed);
	const total = testData.map((d) => d.tests.total);

	new Chart(ctx, {
		type: "line",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Total Tests",
					data: total,
					borderColor: "#94a3b8",
					borderDash: [5, 5],
					backgroundColor: "transparent",
					pointRadius: 2,
					tension: 0,
				},
				{
					label: "Passed",
					data: passed,
					borderColor: "#10b981",
					backgroundColor: "rgba(16, 185, 129, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
				{
					label: "Failed",
					data: failed,
					borderColor: "#ef4444",
					backgroundColor: "rgba(239, 68, 68, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: "index",
				intersect: false,
			},
			plugins: {
				legend: {
					labels: { color: "#f1f5f9" },
				},
				tooltip: {
					callbacks: {
						afterBody: (context) => {
							const index = context[0].dataIndex;
							const item = testData[index];
							return [
								"",
								`Commit: ${item.hash}`,
								`Msg: ${item.message.substring(0, 50)}${item.message.length > 50 ? "..." : ""}`,
							];
						},
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: { color: "#94a3b8" },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
				x: {
					ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 45 },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
			},
		},
	});
}

function initLocChart(data) {
	const ctx = document.getElementById("projectLocChart").getContext("2d");
	const locData = data.filter((d) => d.project?.loc >= 0);

	new Chart(ctx, {
		type: "line",
		data: {
			labels: locData.map((d) => d.timestamp.split(" ")[0]),
			datasets: [
				{
					label: "Lines of Code",
					data: locData.map((d) => d.project.loc),
					borderColor: "#10b981",
					backgroundColor: "rgba(16, 185, 129, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: "index",
				intersect: false,
			},
			plugins: {
				legend: { labels: { color: "#f1f5f9" } },
				tooltip: {
					callbacks: {
						afterBody: (context) => {
							const index = context[0].dataIndex;
							const item = locData[index];
							return [
								"",
								`Commit: ${item.hash}`,
								`Msg: ${item.message.substring(0, 50)}${item.message.length > 50 ? "..." : ""}`,
							];
						},
					},
				},
			},
			scales: {
				y: {
					ticks: { color: "#94a3b8" },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
				x: {
					ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 45 },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
			},
		},
	});
}

function initFilesChart(data) {
	const ctx = document.getElementById("fileDistributionChart").getContext("2d");
	const fileData = data.filter((d) => d.project?.totalFiles >= 0);

	new Chart(ctx, {
		type: "line",
		data: {
			labels: fileData.map((d) => d.timestamp.split(" ")[0]),
			datasets: [
				{
					label: "Total Files",
					data: fileData.map((d) => d.project.totalFiles),
					borderColor: "#38bdf8",
					backgroundColor: "rgba(56, 189, 248, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
				{
					label: "Test Files",
					data: fileData.map((d) => d.project.testFiles || 0),
					borderColor: "#f59e0b",
					backgroundColor: "rgba(245, 158, 11, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: "index",
				intersect: false,
			},
			plugins: {
				legend: { labels: { color: "#f1f5f9" } },
				tooltip: {
					callbacks: {
						afterBody: (context) => {
							const index = context[0].dataIndex;
							const item = fileData[index];
							return [
								"",
								`Commit: ${item.hash}`,
								`Msg: ${item.message.substring(0, 50)}${item.message.length > 50 ? "..." : ""}`,
							];
						},
					},
				},
			},
			scales: {
				y: {
					ticks: { color: "#94a3b8" },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
				x: {
					ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 45 },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
			},
		},
	});
}

function initDependenciesChart(data) {
	const ctx = document.getElementById("dependenciesChart").getContext("2d");
	const depData = data.filter((d) => d.project?.dependencies >= 0);

	new Chart(ctx, {
		type: "line",
		data: {
			labels: depData.map((d) => d.timestamp.split(" ")[0]),
			datasets: [
				{
					label: "Prod Deps",
					data: depData.map((d) => d.project.dependencies),
					borderColor: "#818cf8",
					backgroundColor: "rgba(129, 140, 248, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
				{
					label: "Dev Deps",
					data: depData.map((d) => d.project.devDependencies),
					borderColor: "#ec4899",
					backgroundColor: "rgba(236, 72, 153, 0.1)",
					fill: true,
					tension: 0.3,
					pointRadius: 4,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: "index",
				intersect: false,
			},
			plugins: {
				legend: { labels: { color: "#f1f5f9" } },
				tooltip: {
					callbacks: {
						afterBody: (context) => {
							const index = context[0].dataIndex;
							const item = depData[index];
							return [
								"",
								`Commit: ${item.hash}`,
								`Msg: ${item.message.substring(0, 50)}${item.message.length > 50 ? "..." : ""}`,
							];
						},
					},
				},
			},
			scales: {
				y: {
					ticks: { color: "#94a3b8" },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
				x: {
					ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 45 },
					grid: { color: "rgba(255, 255, 255, 0.05)" },
				},
			},
		},
	});
}

async function init() {
	const data = await loadData();
	if (data.length === 0) {
		const grid = document.querySelector(".charts-grid");
		if (grid) {
			grid.innerHTML =
				'<div class="card">No data found. Please ensure bundle-history.jsonl exists.</div>';
		}
		return;
	}
	initBundleChart(data);
	initTestsChart(data);
	initLocChart(data);
	initFilesChart(data);
	initDependenciesChart(data);
}

init();
