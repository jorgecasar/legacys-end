import { msg } from "@lit/localize";
import { html } from "lit";

/**
 * The Tunic of Isolation Quest - Chapter Data
 *
 * This quest teaches the basics of Web Components:
 * - cb-1: Encapsulation (Shadow DOM, Custom Elements)
 */

/**
 * @typedef {import("../quest-types.js").LevelConfig} LevelConfig
 */

/** @returns {Record<string, LevelConfig>} */
export const getAuraOfSovereigntyChapters = () => ({
	"swamp-of-scope": {
		id: "swamp-of-scope",
		title: msg("The Swamp of Global Scope"),
		description: msg(
			"Alarion's components break under Global CSS pollution. The Rainwalker shows him the Shadow Boundary—a protective barrier that shields his code from the outside world.",
		),
		problemTitle: msg("Before: Style Bleeding"),
		problemDesc: msg("Global styles destroy component appearance."),
		solutionTitle: msg("After: Shadow Encapsulation"),
		backgroundStyle: `url('/assets/swamp-of-scope/background.png')`,
		npc: {
			name: msg("The Rainwalker"),
			image: "/assets/swamp-of-scope/npc.png",
			position: { x: 40, y: 55 },
		},
		reward: {
			name: msg("Umbrella"),
			image: "/assets/swamp-of-scope/reward.png",
			position: { x: 40, y: 40 },
		},
		hero: {
			image: "/assets/swamp-of-scope/hero.png",
			reward: "/assets/swamp-of-scope/hero-reward.png",
		},
		startPos: { x: 65, y: 10 },
		exitZone: {
			x: 10,
			y: 95,
			width: 30,
			height: 10,
			label: msg("Hall of Fragments"),
		},
		codeSnippets: {
			start: [
				{
					title: msg("The Acid Rain: Global styles that bleed everywhere"),
					language: "html",
					code: `<style>
  h1 {
    color: red !important;
    font-size: 50px;
    border-bottom: 5px solid chaos;
  }
</style>

<div class="my-house">
   <h1>Welcome Home</h1>
</div>`,
				},
			],
			end: [
				{
					title: msg("UMBRELLA (Encapsulated Styles)"),
					code: `import { LitElement, html, css } from 'lit';

export class SafeHouse extends LitElement {
  static styles = css\`
    :host {
      display: block;
      border: 2px solid silver; /* The Barrier */
    }
    h1 {
      color: blue; /* Alarion's Choice wins! */
      font-size: 20px;
    }
\`;

  render() {
    return html\`<h1> Safe inside the Shadow DOM</h1>\`;
  }
}`,
				},
			],
		},
	},
	"hall-of-fragments": {
		id: "hall-of-fragments",
		title: msg("Hall of Fragments"),
		description: msg(
			"Focuses on removing global dependencies and encapsulating the code, achieving Shadow DOM and Custom Elements.",
		),
		problemTitle: msg("Problem: The code is tangled."),
		problemDesc: html`
		<ul>
			<li>${msg("It handles business logic (fetch),")}</li>
			<li>${msg("knows the global DOM structure (getElementById),")}</li>
			<li>${msg("and injects styles and structure (innerHTML).")}</li>
		</ul>`,

		solutionTitle: msg("Solution: The Evolved Code (Lit Web Component)"),
		architecturalChanges: [
			msg(
				"Identity Gained: The code is now a defined entity <product-item>), not a chaotic script.",
			),
			msg(
				"DOM Independent: The component no longer uses getElementById or interacts with the global DOM directly.",
			),
			msg(
				"Encapsulation Achieved: The static styles ensure the component is protected from the Monolith's global CSS (Shadow DOM).",
			),
			msg(
				"First Step Taken: Structure and Style are now safe, even if Logic is still coupled.",
			),
		],

		codeSnippets: {
			start: [
				{
					title: msg("Couple Logic"),
					code: `function renderProfile() {
	// ❌ Logical Coupling: The UI controls data fetching.
	fetch('https://legacycorp.com/product-data')
		.then(res => res.json())
		.then(data => {
			// ❌ DOM Coupling: Knows the global container ID.
			const container = document.getElementById('user-profile-container');

			// ❌ Visual Coupling: Injecting structure and style.
			container.innerHTML = \`<h1>\${data.name}</h1>
			<p>\${data.description}</p>\`;
		});
}
renderProfile();`,
				},
			],
			end: [
				{
					title: msg("Web Componet encapsulation"),
					code: `import { LitElement, html } from 'lit';

export class ProductItem extends LitElement {
	static properties = {
		product: { type: Object }
	};

	service = {
		fetchProductData: (id) => {
			// ⚠️ Logic is still here, but is not coupled to the DOM!
			fetch(\`https://legacycorp.com/product-data/\${id}\`)
				.then(res => res.json())
				.catch(err => this.product = {
					name: 'Error',
					description: 'Failed to load data'
				})
		}
	};

	connectedCallback() {
		super.connectedCallback();
		this.service.fetchData().then(data => this.product = data);
	}

	render() {
		if (!this.product) {
			return html\`<p>Waiting...</p>\`;
		}
		return html\`
			<h1>\${this.product.name}</h1>
			<p>\${this.product.description}</p>
		\`;
	}
}
customElements.define('product-item', ProductItem);`,
				},
			],
		},
		stats: { maintainability: 0, portability: 0 },
		serviceType: /** @type {any} */ (null),
		startPos: { x: 50, y: 15 },
		exitZone: {
			x: 95,
			y: 50,
			width: 10,
			height: 20,
			label: msg("The Shadow Threshold"),
		},
		backgroundStyle: `url('/assets/hall-of-fragments/background.png')`,
		npc: {
			name: msg("Fragments' Oracle"),
			icon: "user",
			image: "/assets/hall-of-fragments/npc.png",
			position: { x: 50, y: 40 },
		},
		reward: {
			name: msg("Garments"),
			image: "/assets/hall-of-fragments/reward.png",
			position: { x: 60, y: 45 },
		},
		hero: {
			image: "/assets/hall-of-fragments/hero.png",
			reward: "/assets/hall-of-fragments/hero-reward.png",
		},
	},
});
