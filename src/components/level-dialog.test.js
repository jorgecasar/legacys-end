import { beforeEach, describe, expect, it } from "vitest";
import "./level-dialog.js";

describe("LevelDialog Component", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders narrative slide first if description is present", async () => {
		const el = document.createElement("level-dialog");
		el.config = {
			description: "Intro Narrative",
		};
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Intro Narrative");
	});

	it("renders problem slide if description is missing", async () => {
		const el = document.createElement("level-dialog");
		el.config = {
			problemDesc: "Problem Description",
		};
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot.textContent).toContain("Problem Description");
	});
});
