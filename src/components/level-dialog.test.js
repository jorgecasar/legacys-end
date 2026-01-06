import { beforeEach, describe, expect, it } from "vitest";
import "./level-dialog.js";

/** @typedef {import("./level-dialog.js").LevelDialog} LevelDialog */

describe("LevelDialog Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders narrative slide first if description is present", async () => {
		const el = /** @type {LevelDialog} */ (
			document.createElement("level-dialog")
		);
		el.config = /** @type {any} */ ({
			description: "Intro Narrative",
		});
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Intro Narrative");
	});

	it("renders problem slide if description is missing", async () => {
		const el = /** @type {LevelDialog} */ (
			document.createElement("level-dialog")
		);
		el.config = /** @type {any} */ ({
			problemDesc: "Problem Description",
		});
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Problem Description");
	});
});
