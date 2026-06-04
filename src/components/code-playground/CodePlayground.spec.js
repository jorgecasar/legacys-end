import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./CodePlayground.js";

describe("CodePlayground", () => {
	/** @type {import('./CodePlayground.js').CodePlayground} */
	let el;

	beforeEach(() => {
		el = /** @type {import('./CodePlayground.js').CodePlayground} */ (
			document.createElement("code-playground")
		);
		document.body.appendChild(el);
	});

	afterEach(() => {
		el.remove();
	});

	it("renders the playground-project element", async () => {
		await el.updateComplete;
		const project = el.shadowRoot?.querySelector("playground-project");
		expect(project).not.toBeNull();
	});

	it("passes files configuration to the playground project", async () => {
		const files = {
			"index.html": "<p>Hello</p>",
			"script.js": "console.log(1);",
		};
		el.files = files;

		await el.updateComplete;

		const project =
			/** @type {import('playground-elements/playground-project.js').PlaygroundProject} */ (
				el.shadowRoot?.querySelector("playground-project")
			);
		expect(project).not.toBeNull();
		expect(project?.config).toBeDefined();
	});
});
