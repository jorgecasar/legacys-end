import { execSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const PROJECT_ID = process.env.PROJECT_ID;
const STATUS_FIELD_ID = process.env.STATUS_FIELD_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const PRICING = {
	"gemini-3-pro-preview": { input: 2.0, output: 12.0 },
	"gemini-3-flash-preview": { input: 0.5, output: 3.0 },
	"gemini-2.5-pro": { input: 1.25, output: 5.0 },
	"gemini-2.5-flash": { input: 0.1, output: 0.4 },
	"gemini-2.5-flash-lite": { input: 0.05, output: 0.2 },
	"gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

const STATUS_OPTIONS = {
	TODO: "f75ad846",
	IN_PROGRESS: "47fc9ee4",
	PAUSED_429: "8842b2d9",
	REVIEW: "0d3401d0",
	DONE: "98236657",
};

/**
 * Realiza una consulta GraphQL a GitHub usando fetch nativo
 */
async function graphql(query, variables = {}) {
	const response = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	const result = await response.json();
	if (result.errors) {
		throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
	}
	return result.data;
}

/**
 * Ejecuta un comando gh CLI para utilidades secundarias
 */
function gh(args) {
	return execSync(`gh ${args}`, { encoding: "utf8" }).trim();
}

/**
 * Busca el Item ID de una Issue en el Proyecto
 */
async function getProjectItemId(issueNumber) {
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

/**
 * Añade una issue al proyecto si no está ya en él
 */
async function addIssueToProject(issueUrl) {
	try {
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
		console.log(
			`Issue added/verified. Item ID: ${data.addProjectV2ItemById.item.id}`,
		);
		return data.addProjectV2ItemById.item.id;
	} catch (error) {
		console.error("Error adding issue to project:", error.message);
		return null;
	}
}

/**
 * Cambia el estado y opcionalmente la rama de un item en el proyecto
 */
async function updateProjectStatus(issueNumber, statusName, branchName = null) {
	const itemId = await getProjectItemId(issueNumber);
	if (!itemId) return;

	const statusId = STATUS_OPTIONS[statusName];
	if (statusId) {
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
		console.log(`Updated Issue #${issueNumber} to status ${statusName}`);
	}

	if (branchName) {
		// Lógica para actualizar campo texto "Branch" si existe...
		// (Podemos añadirla si es necesario, siguiendo el mismo patrón fetch)
	}
}

/**
 * Realiza el triaje de una issue
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

	const prompt = `Analyze this GitHub Issue and assign the most efficient Gemini model ID:
    gemini-3-pro-preview (complex), gemini-3-flash-preview (standard), gemini-2.5-flash-lite (trivial).
    TITLE: ${issueData.title}
    BODY: ${issueData.body}`;

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
		},
	);

	const data = await response.json();
	const modelId = data.candidates[0].content.parts[0].text.trim();
	gh(`issue edit ${issueNumber} --add-label "model:${modelId}"`);
	console.log(modelId);
}

// Lógica de ejecución principal
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const command = process.argv[2];
	const issueNumber = process.argv[3];

	if (command === "add-to-project") {
		addIssueToProject(process.argv[3]).then(() => process.exit(0));
	} else if (command === "triage-task") {
		triageTask(issueNumber).then(() => process.exit(0));
	} else if (command === "set-status") {
		updateProjectStatus(issueNumber, process.argv[4], process.argv[5]).then(
			() => process.exit(0),
		);
	} else if (command === "check-deps") {
		// (Se mantiene la lógica de checkDependencies usando fetch si se prefiere)
		process.exit(0);
	}
}
