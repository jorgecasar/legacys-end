import { ContextProvider } from "@lit/context";
import axe from "axe-core";
import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { profileContext } from "../../contexts/profile-context.js";
import "./hero-profile.js";

/** @typedef {import("./HeroProfile.js").HeroProfile} HeroProfile */
/** @typedef {import("./HeroProfile.js").ProfileData} ProfileData */

describe("HeroProfile", () => {
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

	it("should display the hero name from profile context", async () => {
		const profileData = {
			name: "Test Hero",
			role: "Acolyte",
			loading: false,
			error: null,
		};

		// Render with a provider to simulate app context
		render(
			html`
				<div id="provider-container">
				</div>
			`,
			container,
		);

		const providerContainer = /** @type {HTMLElement} */ (
			container.querySelector("#provider-container")
		);
		/** @type {{context: import('@lit/context').Context<any, any>, initialValue?: ProfileData }} */
		const options = { context: profileContext };
		if (profileData != null) {
			options.initialValue = /** @type {ProfileData} */ (
				/** @type {unknown} */ (profileData)
			);
		}
		new ContextProvider(providerContainer, options);

		render(html`<hero-profile></hero-profile>`, providerContainer);
		const element = /** @type {HeroProfile} */ (
			providerContainer.querySelector("hero-profile")
		);
		await element.updateComplete;

		// Check if the name matches
		const nameTag = /** @type {HTMLElement} */ (
			element.shadowRoot?.querySelector(".name-tag")
		);
		expect(nameTag.textContent?.trim()).toBe("Test Hero");
	});

	it("should display '...' when profile is loading", async () => {
		const profileData = {
			loading: true,
		};

		render(html`<div id="provider-container"></div>`, container);
		const providerContainer = /** @type {HTMLElement} */ (
			container.querySelector("#provider-container")
		);
		/** @type {{context: import('@lit/context').Context<any, any>, initialValue?: ProfileData }} */
		const options = { context: profileContext };
		if (profileData != null) {
			options.initialValue = /** @type {ProfileData} */ (
				/** @type {unknown} */ (profileData)
			);
		}
		new ContextProvider(providerContainer, options);

		render(html`<hero-profile></hero-profile>`, providerContainer);
		const element = /** @type {HeroProfile} */ (
			providerContainer.querySelector("hero-profile")
		);
		await element.updateComplete;

		const loadingSpan = /** @type {HTMLElement} */ (
			element.shadowRoot?.querySelector(".loading")
		);
		expect(loadingSpan.textContent?.trim()).toBe("...");
	});

	it("should have no accessibility violations", async () => {
		const profileData = {
			name: "Test Hero",
			role: "Acolyte",
			loading: false,
			error: null,
		};

		render(html`<div id="provider-container"></div>`, container);
		const providerContainer = /** @type {HTMLElement} */ (
			container.querySelector("#provider-container")
		);
		/** @type {{context: import('@lit/context').Context<any, any>, initialValue?: ProfileData }} */
		const options = { context: profileContext };
		if (profileData != null) {
			options.initialValue = /** @type {ProfileData} */ (
				/** @type {unknown} */ (profileData)
			);
		}
		new ContextProvider(providerContainer, options);

		render(html`<hero-profile></hero-profile>`, providerContainer);
		const element = /** @type {HeroProfile} */ (
			providerContainer.querySelector("hero-profile")
		);
		await element.updateComplete;

		const results = await axe.run(element);
		expect(results.violations).toEqual([]);
	});
});
