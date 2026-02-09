import { execSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// --- Cargar variables de entorno local si existen (.env o .env.local) ---
for (const envFile of [".env.local", ".env"]) {
	if (fs.existsSync(envFile)) {
		try {
			process.loadEnvFile(envFile);
		} catch (e) {
			console.error(`⚠️ No se pudo cargar ${envFile}:`, e.message);
		}
	}
}

// --- Configuración y Validación de Entorno ---
const PROJECT_ID = process.env.PROJECT_ID;
const STATUS_FIELD_ID = process.env.STATUS_FIELD_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function validateEnv(required = []) {
	for (const key of required) {
		if (!process.env[key]) {
			throw new Error(`Environment variable ${key} is missing.`);
		}
	}
}

// Log diagnóstico (Seguro) - Redirect to stderr
if (GITHUB_TOKEN) {
	if (
		GITHUB_TOKEN.startsWith("ghp_") ||
		GITHUB_TOKEN.startsWith("github_pat_")
	) {
		console.error("🔐 Usando un Personal Access Token (PAT) detectado.");
	} else {
		console.error("ℹ️ Usando el GITHUB_TOKEN por defecto de la integración.");
	}
}

export const PRICING = {
	"gemini-3-pro-preview": { input: 2.0, output: 12.0 },
	"gemini-3-flash-preview": { input: 0.5, output: 3.0 },
	"gemini-2.5-pro": { input: 1.25, output: 5.0 },
	"gemini-2.5-flash": { input: 0.1, output: 0.4 },
	"gemini-2.5-flash-lite": { input: 0.05, output: 0.2 },
	"gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

export const STATUS_OPTIONS = {
	TODO: "f75ad846",
	IN_PROGRESS: "47fc9ee4",
	PAUSED_429: "8842b2d9",
	REVIEW: "0d3401d0",
	DONE: "98236657",
};

/**
 * Realiza una consulta GraphQL a GitHub usando fetch nativo
 */
export async function graphql(query, variables = {}) {
	validateEnv(["GITHUB_TOKEN"]);
	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`HTTP Error ${response.status}: ${text}`);
	}

	const result = await response.json();
	if (result.errors) {
		throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
	}
	return result.data;
}

/**
 * Ejecuta un comando gh CLI
 */
export function gh(args) {
	try {
		return execSync(`gh ${args}`, { encoding: "utf8" }).trim();
	} catch (error) {
		console.error(`Error executing gh ${args}:`, error.stdout || error.message);
		throw error;
	}
}

// --- Lógica de Negocio ---

export async function getProjectItemId(issueNumber) {
	validateEnv(["PROJECT_ID"]);
	const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(last: 100) {
            nodes {
              id
              content {
                ... on Issue { number }
              }
            }
          }
        }
      }
    }
  `;
	const data = await graphql(query, { projectId: PROJECT_ID });
	const item = data.node.items.nodes.find(
		(n) => n.content && n.content.number === Number(issueNumber),
	);
	return item ? item.id : null;
}

export async function getFieldId(fieldName) {
	validateEnv(["PROJECT_ID"]);
	const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 50) {
            nodes {
              ... on ProjectV2Field { id name }
              ... on ProjectV2SingleSelectField { id name }
              ... on ProjectV2IterationField { id name }
            }
          }
        }
      }
    }
  `;
	const data = await graphql(query, { projectId: PROJECT_ID });
	const field = data.node.fields.nodes.find((f) => f.name === fieldName);
	return field ? field.id : null;
}

export async function addIssueToProject(issueUrl) {
	try {
		validateEnv(["PROJECT_ID"]);
		const issueNumber = issueUrl.split("/").pop();
		const issueData = JSON.parse(gh(`issue view ${issueNumber} --json id`));
		const issueId = issueData.id;

		const query = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
          item { id }
        }
      }
    `;
		const data = await graphql(query, {
			projectId: PROJECT_ID,
			contentId: issueId,
		});
		console.error(`✅ Issue añadida/verificada en el proyecto.`);
		return data.addProjectV2ItemById.item.id;
	} catch (error) {
		console.error("❌ Error adding issue to project:", error.message);
		return null;
	}
}

export async function updateProjectStatus(
	issueNumber,
	statusName,
	branchName = null,
) {
	const itemId = await getProjectItemId(issueNumber);
	if (!itemId) {
		console.error(`⚠️ Issue #${issueNumber} no encontrada en el proyecto.`);
		return;
	}

	const statusId = STATUS_OPTIONS[statusName];
	if (statusId) {
		validateEnv(["STATUS_FIELD_ID"]);
		const query = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) { clientMutationId }
      }
    `;
		await graphql(query, {
			projectId: PROJECT_ID,
			itemId,
			fieldId: STATUS_FIELD_ID,
			optionId: statusId,
		});
		console.error(`✅ Issue #${issueNumber} movida a ${statusName}`);
	}

	if (branchName) {
		const branchFieldId = await getFieldId("Branch");
		if (branchFieldId) {
			const query = `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $branch: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
            value: { text: $branch }
          }) { clientMutationId }
        }
      `;
			await graphql(query, {
				projectId: PROJECT_ID,
				itemId,
				fieldId: branchFieldId,
				branch: branchName,
			});
			console.error(`✅ Campo Branch actualizado a: ${branchName}`);
		}
	}
}

export async function getOpenDependencies(issueNumber) {
	const issueData = JSON.parse(gh(`issue view ${issueNumber} --json body`));
	const issueBody = issueData.body;

	const depRegex = /Depends on #(\d+)/g;
	const textDependencies = [];
	let match;
	// Fix Biome warning
	match = depRegex.exec(issueBody);
	while (match !== null) {
		textDependencies.push(match[1]);
		match = depRegex.exec(issueBody);
	}

	const query = `
    query($owner: String!, $repo: String!, $issueNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $issueNumber) {
          blockedBy(first: 50) { nodes { number state } }
          trackedIssues(first: 50) { nodes { number state } }
        }
      }
    }
  `;
	const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
	const data = await graphql(query, {
		owner,
		repo,
		issueNumber: Number(issueNumber),
	});
	const issue = data.repository.issue;

	const allDeps = [
		...textDependencies.map((id) => ({ number: Number(id), type: "text" })),
		...issue.blockedBy.nodes.map((dep) => ({
			number: dep.number,
			state: dep.state,
			type: "native",
		})),
		...issue.trackedIssues.nodes.map((dep) => ({
			number: dep.number,
			state: dep.state,
			type: "native",
		})),
	];

	const openDeps = [];
	for (const dep of allDeps) {
		let isClosed = false;
		if (dep.type === "native") {
			isClosed = dep.state === "CLOSED";
		} else {
			const state = gh(`issue view ${dep.number} --json state -q .state`);
			isClosed = state === "CLOSED";
		}
		if (!isClosed) openDeps.push(dep.number);
	}
	return [...new Set(openDeps)];
}

export async function autoPickTask() {
	const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(last: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  number
                  state
                  milestone { number title }
                  labels(first: 10) { nodes { name } }
                }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    optionId
                    field { ... on ProjectV2FieldCommon { name } }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
	const data = await graphql(query, { projectId: PROJECT_ID });
	const items = data.node.items.nodes;

	console.error(`🔍 Analizando ${items.length} elementos en el proyecto...`);

	const openIssues = items.filter((item) => {
		if (!item.content || item.content.state !== "OPEN") return false;
		const labels = item.content.labels.nodes.map((l) => l.name);
		return !labels.includes("blocked");
	});

	if (openIssues.length === 0) {
		console.error("❌ No hay issues abiertas y desbloqueadas en el proyecto.");
		return null;
	}

	const getStatusId = (item) => {
		const field = item.fieldValues.nodes.find(
			(fv) => fv.field && fv.field.name === "Status",
		);
		return field ? field.optionId : null;
	};

	// Log de estados para debug
	openIssues.forEach((i) => {
		console.error(
			`- Issue #${i.content.number}: Estado=${getStatusId(i)}, Milestone=${i.content.milestone?.number || "None"}`,
		);
	});

	const activeMilestones = openIssues
		.map((i) => (i.content.milestone ? i.content.milestone.number : 999))
		.sort((a, b) => a - b);

	const lowestMilestoneNum = activeMilestones[0];
	console.error(
		`🎯 Milestone objetivo: ${lowestMilestoneNum === 999 ? "Ninguno" : lowestMilestoneNum}`,
	);

	const milestoneIssues = openIssues.filter((i) => {
		const mNum = i.content.milestone ? i.content.milestone.number : 999;
		return mNum === lowestMilestoneNum;
	});

	const paused = milestoneIssues.find(
		(i) => getStatusId(i) === STATUS_OPTIONS.PAUSED_429,
	);
	if (paused) {
		console.error(
			`🚀 Reanudando Issue #${paused.content.number} (Pausada por 429)`,
		);
		return paused.content.number;
	}

	const todo = milestoneIssues.find(
		(i) => getStatusId(i) === STATUS_OPTIONS.TODO,
	);
	if (todo) {
		console.error(`🚀 Iniciando Issue #${todo.content.number} (Todo)`);
		return todo.content.number;
	}

	console.error(
		"❌ No hay tareas en estado TODO o PAUSED para el milestone actual.",
	);
	return null;
}

export async function triageTask(issueNumber) {
	const issueData = JSON.parse(
		gh(`issue view ${issueNumber} --json title,labels`),
	);
	const currentModelLabel = issueData.labels.find((l) =>
		l.name.startsWith("model:"),
	);

	if (currentModelLabel) {
		process.stdout.write(currentModelLabel.name.split(":")[1]);
		return;
	}

	const prompt = `Model ID for task "${issueData.title}". Labels: ${issueData.labels.map((l) => l.name).join(",")}. Return ONLY: gemini-3-pro-preview, gemini-3-flash-preview, or gemini-2.5-flash-lite.`;

	try {
		// Usar la CLI de Gemini para el triaje
		const modelId = execSync(
			`gemini --non-interactive --model gemini-2.5-flash-lite "${prompt}"`,
			{
				encoding: "utf8",
				env: { ...process.env },
			},
		).trim();

		const validModels = [
			"gemini-3-pro-preview",
			"gemini-3-flash-preview",
			"gemini-2.5-pro",
			"gemini-2.5-flash",
			"gemini-2.5-flash-lite",
			"gemini-2.0-flash",
		];
		const finalModel = validModels.includes(modelId)
			? modelId
			: "gemini-2.5-flash-lite";

		try {
			gh(
				`label create "model:${finalModel}" --color "fbca04" --description "AI Model assigned to this task"`,
			);
		} catch (_e) {}

		gh(`issue edit ${issueNumber} --add-label "model:${finalModel}"`);
		process.stdout.write(finalModel);
	} catch (_error) {
		console.error("⚠️ Triage failed, fallback to gemini-2.5-flash-lite");
		process.stdout.write("gemini-2.5-flash-lite");
	}
}

export async function logSessionStats(issueNumber, modelId, logFile) {
	if (!fs.existsSync(logFile)) return;
	const content = fs.readFileSync(logFile, "utf8");
	const sentMatch = content.match(/([0-9.]+)(k?)\s+sent/i);
	const recvMatch = content.match(/([0-9.]+)(k?)\s+received/i);
	const costMatch = content.match(/Cost:.*?\$([0-9.]+)\s+session/i);
	if (!sentMatch || !recvMatch) return;

	const parseTokens = (val, unit) => {
		let num = parseFloat(val);
		if (unit.toLowerCase() === "k") num *= 1000;
		return Math.round(num);
	};

	const inputTokens = parseTokens(sentMatch[1], sentMatch[2]);
	const outputTokens = parseTokens(recvMatch[1], recvMatch[2]);
	const cost = costMatch
		? parseFloat(costMatch[1])
		: (inputTokens / 1000000) * (PRICING[modelId]?.input || 0.5) +
			(outputTokens / 1000000) * (PRICING[modelId]?.output || 3.0);

	const issueData = JSON.parse(gh(`issue view ${issueNumber} --json comments`));
	const statsComment = issueData.comments.find((c) =>
		c.body.includes("<!-- session-stats -->"),
	);
	const sessions = statsComment
		? JSON.parse(statsComment.body.match(/```json\n([\s\S]*?)\n```/)[1])
		: [];

	sessions.push({
		date: new Date().toISOString(),
		model: modelId,
		input: inputTokens,
		output: outputTokens,
		cost: parseFloat(cost.toFixed(6)),
	});

	const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
	const commentBody = `### 📊 AI Session Report <!-- session-stats -->\n| Session | Model | Tokens (I/O) | Cost |\n| :--- | :--- | :--- | :--- |\n${sessions.map((s, i) => `| #${i + 1} | \`${s.model}\` | ${s.input}/${s.output} | $${s.cost} |`).join("\n")}\n\n**Total Sessions:** ${sessions.length}\n**Total Estimated Cost:** **$${totalCost.toFixed(6)}**\n\n<details><summary>Raw Data</summary>\n\n\`\`\`json\n${JSON.stringify(sessions, null, 2)}\n\`\`\`\n</details>`;

	const cmd = statsComment ? `--edit-last` : "";
	gh(
		`issue comment ${issueNumber} ${cmd} --body "${commentBody.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
	);
}

// --- Punto de Entrada CLI ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const command = process.argv[2];
	const issueNumber = process.argv[3];

	(async () => {
		try {
			if (command === "auto-pick") {
				const num = await autoPickTask();
				if (num) {
					process.stdout.write(num.toString());
					process.exit(0);
				} else {
					process.exit(1);
				}
			} else if (command === "add-to-project") {
				await addIssueToProject(process.argv[3]);
				process.exit(0);
			} else if (command === "triage-task") {
				await triageTask(issueNumber);
				process.exit(0);
			} else if (command === "log-session-stats") {
				await logSessionStats(issueNumber, process.argv[4], process.argv[5]);
				process.exit(0);
			} else if (command === "check-deps") {
				const openDeps = await getOpenDependencies(issueNumber);
				if (openDeps.length > 0) {
					for (const depNum of openDeps) {
						await addIssueToProject(
							`https://github.com/${process.env.GITHUB_REPOSITORY}/issues/${depNum}`,
						);
						await updateProjectStatus(depNum, "TODO");
					}
					gh(`issue edit ${issueNumber} --add-label blocked`);
					gh(
						`issue comment ${issueNumber} --body "🚫 Tarea bloqueada por: ${openDeps.map((n) => `#${n}`).join(", ")}. He movido las dependencias a TODO."`,
					);
					process.exit(1);
				}
				const labelsData = JSON.parse(
					gh(`issue view ${issueNumber} --json labels`),
				);
				const labels = labelsData.labels.map((l) => l.name);
				if (labels.includes("blocked"))
					gh(`issue edit ${issueNumber} --remove-label blocked`);
				process.exit(0);
			} else if (command === "set-status") {
				await updateProjectStatus(
					issueNumber,
					process.argv[4],
					process.argv[5],
				);
				process.exit(0);
			}
		} catch (error) {
			console.error(`💥 Execution Failed: ${error.message}`);
			process.exit(1);
		}
	})();
}
