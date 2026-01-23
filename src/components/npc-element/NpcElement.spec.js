import axe from "axe-core";
import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "./npc-element.js";

/** @typedef {import("./NpcElement.js").NpcElement} NpcElement */

describe("NpcElement", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container) {
			container.remove();
		}
		vi.clearAllMocks();
	});

	it("renders with basic properties", async () => {
		render(
			html`<npc-element name="Guide" icon="user" .x=${50} .y=${50}></npc-element>`,
			container,
		);
		const element = /** @type {NpcElement} */ (
			container.querySelector("npc-element")
		);
		await element.updateComplete;

		expect(element.shadowRoot?.textContent).toContain("Guide");
		expect(element.style.left).toBe("50%");
		expect(element.style.top).toBe("50%");
	});

	it("displays tooltip when close but not collected", async () => {
		render(
			html`<npc-element 
                name="Guide" 
                icon="user" 
                .isClose=${true} 
                .hasCollectedItem=${false} 
                action="SPEAK">
            </npc-element>`,
			container,
		);
		const element = /** @type {NpcElement} */ (
			container.querySelector("npc-element")
		);
		await element.updateComplete;

		expect(element.isClose).toBe(true);
		expect(element.hasCollectedItem).toBe(false);

		const tooltip =
			/** @type {import('@awesome.me/webawesome/dist/components/tooltip/tooltip.js').default} */ (
				element.shadowRoot?.querySelector("wa-tooltip")
			);
		await tooltip.updateComplete;

		expect(tooltip?.open).toBe(true);
		expect(tooltip?.textContent?.trim()).toContain("SPEAK");
	});

	it("should have no accessibility violations", async () => {
		render(
			html`<npc-element name="Guide" icon="user" .x=${50} .y=${50}></npc-element>`,
			container,
		);
		const element = /** @type {NpcElement} */ (
			container.querySelector("npc-element")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
