const { execSync } = require("node:child_process");

const PROJECT_ID = process.env.PROJECT_ID; // PVT_...
const STATUS_FIELD_ID = process.env.STATUS_FIELD_ID; // PVTSSF_...

const STATUS_OPTIONS = {
	TODO: "f75ad846",
	IN_PROGRESS: "47fc9ee4",
	PAUSED_429: "8842b2d9",
	REVIEW: "0d3401d0",
	DONE: "98236657",
};

/**
 * Precios Feb 2026 por 1M de tokens (Input / Output)
 */
const PRICING = {
	"gemini-3-pro-preview": { input: 2.0, output: 12.0 },
	"gemini-3-flash-preview": { input: 0.5, output: 3.0 },
	"gemini-2.5-pro": { input: 1.25, output: 5.0 },
	"gemini-2.5-flash": { input: 0.1, output: 0.4 },
	"gemini-2.5-flash-lite": { input: 0.05, output: 0.2 },
	"gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

/**
 * Ejecuta un comando gh y devuelve la salida
 */
function gh(args) {
	try {
		return execSync(`gh ${args}`, { encoding: "utf8" }).trim();
	} catch (error) {
		console.error(`Error executing gh ${args}:`, error.message);
		process.exit(1);
	}
}

/**
 * Busca el Item ID de una Issue en el Proyecto
 */
function getProjectItemId(issueNumber) {
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
                }
              }
            }
          }
        }
      }
    }
  `;
	const result = JSON.parse(
		gh(`api graphql -f query='${query}' -F projectId=${PROJECT_ID}`),
	);
	const item = result.data.node.items.nodes.find(
		(n) => n.content.number === Number(issueNumber),
	);
	return item ? item.id : null;
}

/**
 * Busca el ID de un campo por nombre
 */
function getFieldId(fieldName) {
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
	const result = JSON.parse(
		gh(`api graphql -f query='${query}' -F projectId=${PROJECT_ID}`),
	);
	const field = result.data.node.fields.nodes.find((f) => f.name === fieldName);
	return field ? field.id : null;
}

/**
 * Cambia el estado y opcionalmente la rama de un item en el proyecto
 */
function updateProjectStatus(issueNumber, statusName, branchName = null) {
	const itemId = getProjectItemId(issueNumber);
	if (!itemId) {
		console.log(`Issue #${issueNumber} not found in project. Skipping update.`);
		return;
	}

	// 1. Actualizar Status
	const statusId = STATUS_OPTIONS[statusName];
	if (statusId) {
		const statusQuery = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item { id }
        }
      }
    `;
		gh(
			`api graphql -f query='${statusQuery}' -F projectId=${PROJECT_ID} -F itemId=${itemId} -F fieldId=${STATUS_FIELD_ID} -F optionId=${statusId}`,
		);
		console.log(`Updated Issue #${issueNumber} to status ${statusName}`);
	}

	// 2. Actualizar Rama (si se proporciona)
	if (branchName) {
		const branchFieldId = getFieldId("Branch");
		if (branchFieldId) {
			const branchQuery = `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $branch: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId,
            itemId: $itemId,
            fieldId: $fieldId,
            value: { text: $branch }
          }) {
            projectV2Item { id }
          }
        }
      `;
			gh(
				`api graphql -f query='${branchQuery}' -F projectId=${PROJECT_ID} -F itemId=${itemId} -F fieldId=${branchFieldId} -F branch="${branchName}"`,
			);
			console.log(`Updated Issue #${issueNumber} with branch ${branchName}`);
		} else {
			console.log(
				'Field "Branch" not found in project. Skipping branch update.',
			);
		}
	}
}

/**
 * Verifica si las dependencias de una issue están cerradas
 */
function checkDependencies(issueNumber) {
	const issueData = JSON.parse(
		gh(`issue view ${issueNumber} --json body,number`),
	);
	const issueBody = issueData.body;

	// 1. Verificar dependencias por texto "Depends on #123"
	const depRegex = /Depends on #(\d+)/g;
	const textDependencies = [];
	let match = depRegex.exec(issueBody);
	while (match !== null) {
		textDependencies.push(match[1]);
		match = depRegex.exec(issueBody);
	}

	// 2. Verificar dependencias nativas de GitHub (blockedBy y trackedIssues)
	const query = `
    query($owner: String!, $repo: String!, $issueNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $issueNumber) {
          blockedBy(first: 50) {
            nodes {
              number
              state
            }
          }
          trackedIssues(first: 50) {
            nodes {
              number
              state
            }
          }
        }
      }
    }
  `;
	const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
	const gqlResult = JSON.parse(
		gh(
			`api graphql -f query='${query}' -F owner="${owner}" -F repo="${repo}" -F issueNumber=${issueNumber}`,
		),
	);
	const issue = gqlResult.data.repository.issue;

	const blockedBy = issue.blockedBy.nodes;
	const trackedIssues = issue.trackedIssues.nodes;

	// Combinar todas las dependencias
	const allDeps = [
		...textDependencies.map((id) => ({ number: id, type: "text" })),
		...blockedBy.map((dep) => ({
			number: dep.number,
			state: dep.state,
			type: "native",
		})),
		...trackedIssues.map((dep) => ({
			number: dep.number,
			state: dep.state,
			type: "native",
		})),
	];

	for (const dep of allDeps) {
		let isClosed = false;
		if (dep.type === "native") {
			isClosed = dep.state === "CLOSED";
		} else {
			const state = gh(`issue view ${dep.number} --json state -q .state`);
			isClosed = state === "CLOSED";
		}

		if (!isClosed) {
			return { ok: false, blockedBy: dep.number };
		}
	}
	return { ok: true };
}

/**
 * Busca la siguiente tarea para trabajar automáticamente
 */
function autoPickTask() {
	const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  number
                  state
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
	const result = JSON.parse(
		gh(`api graphql -f query='${query}' -F projectId=${PROJECT_ID}`),
	);
	const items = result.data.node.items.nodes;

	// Filtrar solo issues abiertas y que no estén bloqueadas
	const availableIssues = items.filter((item) => {
		if (!item.content || item.content.state !== "OPEN") return false;
		const labels = item.content.labels.nodes.map((l) => l.name);
		return !labels.includes("blocked");
	});

	const getStatus = (item) => {
		const field = item.fieldValues.nodes.find(
			(fv) => fv.field && fv.field.name === "Status",
		);
		return field ? field.optionId : null;
	};

	// 1. Prioridad: Paused (429) - Retomar trabajo interrumpido
	const paused = availableIssues.find(
		(i) => getStatus(i) === STATUS_OPTIONS.PAUSED_429,
	);
	if (paused) return paused.content.number;

	// 2. Prioridad: Todo - Empezar trabajo nuevo
	const todo = availableIssues.find(
		(i) => getStatus(i) === STATUS_OPTIONS.TODO,
	);
	if (todo) return todo.content.number;

	return null;
}

/**
 * Añade una issue al proyecto si no está ya en él
 */
function addIssueToProject(issueUrl) {
	// Primero intentamos añadirlo. Si ya existe, gh simplemente devuelve el ID existente.
	try {
		const projectNumber = process.env.PROJECT_NUMBER || 2;
		const owner = process.env.GITHUB_REPOSITORY_OWNER;
		const result = JSON.parse(
			gh(
				`project item-add ${projectNumber} --owner ${owner} --url ${issueUrl} --format json`,
			),
		);
		console.log(`Issue added/verified in project. Item ID: ${result.id}`);
		return result.id;
	} catch (error) {
		console.error("Error adding issue to project:", error.message);
		return null;
	}
}

/**
 * Realiza el triaje de una issue para determinar el modelo ideal entre los disponibles en Feb 2026
 */
async function triageTask(issueNumber) {
	const issueData = JSON.parse(
		gh(`issue view ${issueNumber} --json title,body,labels`),
	);
	const currentModelLabel = issueData.labels.find((l) =>
		l.name.startsWith("model:"),
	);

	if (currentModelLabel) {
		console.log(currentModelLabel.name.split(":")[1]);
		return;
	}

	const prompt = `
    Analyze this GitHub Issue and assign the most efficient Gemini model available. 
    Available Models & Capabilities:
    - gemini-3-pro-preview: State-of-the-art reasoning, complex agentic tasks, architectural changes.
    - gemini-3-flash-preview: Frontier intelligence + speed. Balanced for logic and scale.
    - gemini-2.5-pro: Complex coding reasoning, long context analysis (stable).
    - gemini-2.5-flash: Best price-performance, high-volume tasks with thinking.
    - gemini-2.5-flash-lite: Fastest, cost-efficient for trivial tasks.
    - gemini-2.0-flash: Legacy workhorse (available until March 31, 2026).

    Selection Criteria:
    1. TRIVIAL (Docs, CSS): gemini-2.5-flash-lite
    2. MICRO (Single fixes, renames): gemini-2.0-flash
    3. SIMPLE (Standard bugs, UI): gemini-3-flash-preview
    4. MEDIUM (New features, unit tests): gemini-2.5-pro
    5. COMPLEX (Core logic, algorithms): gemini-3-pro-preview
    6. CRITICAL (Arch, security): gemini-3-pro-preview

    Return ONLY the model ID.

    TITLE: ${issueData.title}
    BODY: ${issueData.body}
  `;

	try {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
				}),
			},
		);

		const data = await response.json();
		const modelId = data.candidates[0].content.parts[0].text.trim();

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
			: "gemini-3-flash-preview";

		gh(`issue edit ${issueNumber} --add-label "model:${finalModel}"`);
		console.log(finalModel);
	} catch (error) {
		console.error("Triage failed:", error.message);
		console.log("gemini-3-flash-preview");
	}
}

/**
 * Registra las estadísticas de la sesión en la Issue
 */
async function logSessionStats(issueNumber, modelId, logFile) {
	const fs = require("node:fs");
	if (!fs.existsSync(logFile)) return;

	const content = fs.readFileSync(logFile, "utf8");

	// Soportar formato: Tokens: 17k sent, 2.5k received. Cost: $0.01 message, $0.04 session.
	const sentMatch = content.match(/([0-9.]+)(k?)\s+sent/i);
	const recvMatch = content.match(/([0-9.]+)(k?)\s+received/i);
	const costMatch = content.match(/Cost:.*?\$([0-9.]+)\s+session/i);

	if (!sentMatch || !recvMatch) {
		console.log("No token usage found in logs.");
		return;
	}

	const parseTokens = (val, unit) => {
		let num = parseFloat(val);
		if (unit.toLowerCase() === "k") num *= 1000;
		return Math.round(num);
	};

	const inputTokens = parseTokens(sentMatch[1], sentMatch[2]);
	const outputTokens = parseTokens(recvMatch[1], recvMatch[2]);

	let cost;
	if (costMatch) {
		cost = parseFloat(costMatch[1]);
	} else {
		// Fallback a cálculo manual si no está en el log
		const prices = PRICING[modelId] || PRICING["gemini-3-flash-preview"];
		cost =
			(inputTokens / 1000000) * prices.input +
			(outputTokens / 1000000) * prices.output;
	}

	const issueData = JSON.parse(gh(`issue view ${issueNumber} --json comments`));
	const statsComment = issueData.comments.find((c) =>
		c.body.includes("<!-- session-stats -->"),
	);

	let sessions = [];
	if (statsComment) {
		const jsonMatch = statsComment.body.match(/```json\n([\s\S]*?)\n```/);
		if (jsonMatch) sessions = JSON.parse(jsonMatch[1]);
	}

	sessions.push({
		date: new Date().toISOString(),
		model: modelId,
		input: inputTokens,
		output: outputTokens,
		cost: parseFloat(cost.toFixed(6)),
	});

	const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
	const totalSessions = sessions.length;

	const commentBody = `
### 📊 AI Session Report <!-- session-stats -->
| Session | Model | Tokens (I/O) | Cost |
| :--- | :--- | :--- | :--- |
${sessions.map((s, i) => `| #${i + 1} | \`${s.model}\` | ${s.input}/${s.output} | $${s.cost} |`).join("\n")}

**Total Sessions:** ${totalSessions}
**Total Estimated Cost:** **$${totalCost.toFixed(6)}**

<details>
<summary>Raw Data</summary>

\`\`\`json
${JSON.stringify(sessions, null, 2)}
\`\`\`
</details>
`;

	if (statsComment) {
		gh(
			`issue comment ${issueNumber} --edit-last --body "${commentBody.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
		);
	} else {
		gh(
			`issue comment ${issueNumber} --body "${commentBody.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
		);
	}

	console.log(`SESSION_COST=${cost.toFixed(6)}`);
	console.log(`TOTAL_TASK_COST=${totalCost.toFixed(6)}`);
}

// Exportar funciones si se usa como módulo o ejecutar si se llama directamente
if (require.main === module) {
	const command = process.argv[2];
	const issueNumber = process.argv[3];

	if (command === "auto-pick") {
		const pickedNumber = autoPickTask();
		if (pickedNumber) {
			console.log(pickedNumber);
			process.exit(0);
		} else {
			console.error("No tasks found in Paused or Todo.");
			process.exit(1);
		}
	}

	if (command === "add-to-project") {
		const issueUrl = process.argv[3];
		addIssueToProject(issueUrl);
		process.exit(0);
	}

	if (command === "triage-task") {
		triageTask(issueNumber).then(() => process.exit(0));
	} else if (command === "log-session-stats") {
		const modelId = process.argv[4];
		const logFile = process.argv[5];
		logSessionStats(issueNumber, modelId, logFile).then(() => process.exit(0));
	} else if (command === "check-deps") {
		const result = checkDependencies(issueNumber);
		if (!result.ok) {
			console.log(`Issue #${issueNumber} is blocked by #${result.blockedBy}`);
			gh(`issue edit ${issueNumber} --add-label blocked`);
			gh(
				`issue comment ${issueNumber} --body "🚫 Tarea bloqueada por la dependencia #${result.blockedBy}. Por favor, resuelve la dependencia antes de reintentar."`,
			);
			process.exit(1);
		}
		const labels = gh(
			`issue view ${issueNumber} --json labels -q '.labels[].name'`,
		);
		if (labels.includes("blocked")) {
			gh(`issue edit ${issueNumber} --remove-label blocked`);
		}
		process.exit(0);
	} else if (command === "set-status") {
		const status = process.argv[4];
		const branch = process.argv[5];
		updateProjectStatus(issueNumber, status, branch);
		process.exit(0);
	}
}
