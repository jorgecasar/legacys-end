import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./CodePlayground.js";

describe("CodePlayground", () => {
	/** @type {import('./CodePlayground.js').CodePlayground} */
	let el;

	beforeEach(() => {
		el = document.createElement("code-playground");
		document.body.appendChild(el);
	});

	afterEach(() => {
		el.remove();
	});

	it("renders the playground-ide element", async () => {
		await el.updateComplete;
		const ide = el.shadowRoot.querySelector("playground-ide");
		expect(ide).not.toBeNull();
	});

	it("passes files configuration to the playground project", async () => {
		const files = {
			"index.html": "<p>Hello</p>",
			"script.js": "console.log(1);",
		};
		el.files = files;

		await el.updateComplete;

		const ide = el.shadowRoot.querySelector("playground-ide");
		expect(ide).not.toBeNull();
		expect(ide.config).toBeDefined();
	});
});
