import { html } from 'lit';

/**
 * The Tunic of Isolation Quest - Chapter Data
 * 
 * This quest teaches the basics of Web Components:
 * - cb-1: Encapsulation (Shadow DOM, Custom Elements)
 */

export const THE_AURA_OF_SOVEREIGNTY_CHAPTERS = {
	'swamp-of-scope': {
		id: 'swamp-of-scope',
		title: "The Swamp of Global Scope",
		description: "Alarion tries to build a simple house, but the 'Acid Rain' of Global CSS turns his blue walls red. The Warden of Scope hands him the 'Shadow Shield'. Alarion learns to raise the Shadow Boundary, creating a safe bubble where the outside chaos cannot touch his code.",
		problemTitle: "Before: Style Bleeding",
		problemDesc: "Global styles destroy component appearance.",
		solutionTitle: "After: Shadow Encapsulation",
		backgroundStyle: `url('/assets/swamp-of-scope/background.png') center / cover no-repeat`,
		npc: { name: "The Rainwalker", image: "/assets/swamp-of-scope/npc.png", position: { x: 40, y: 55 } },
		reward: { name: "The Sovereign Umbrella", image: "/assets/swamp-of-scope/reward.png", position: { x: 40, y: 40 } },
		hero: { image: "/assets/swamp-of-scope/hero.png", reward: "/assets/swamp-of-scope/hero-reward.png" },
		startPos: { x: 65, y: 10 },
		exitZone: { x: 10, y: 95, width: 30, height: 10, label: 'Hall of Fragments' },
		codeSnippets: {
			start: [{
				title: 'The Acid Rain: Global styles that bleed everywhere',
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
			}],
			end: [{
				title: 'THE SHADOW SHIELD (Encapsulated Styles)',
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
}`
			}]
		}
	},
	'hall-of-fragments': {
		id: 'hall-of-fragments',
		title: "Hall of Fragments",
		description: "Focuses on removing global dependencies and encapsulating the code, achieving Shadow DOM and Custom Elements.",
		problemTitle: "Problem: The code is tangled.",
		problemDesc: html`
		<ul>
			<li>It handles business logic (fetch),</li>
			<li>knows the global DOM structure (getElementById),</li>
			<li>and injects styles and structure (innerHTML).</li>
		</ul>`,

		solutionTitle: "Solution: The Evolved Code (Lit Web Component)",
		architecturalChanges: [
			"Identity Gained: The code is now a defined entity <product-item>), not a chaotic script.",
			"DOM Independent: The component no longer uses getElementById or interacts with the global DOM directly.",
			"Encapsulation Achieved: The static styles ensure the component is protected from the Monolith's global CSS (Shadow DOM).",
			"First Step Taken: Structure and Style are now safe, even if Logic is still coupled."
		],

		codeSnippets: {
			start: [{
				title: 'Couple Logic',
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
			}],
			end: [{
				title: "Web Componet encapsulation",
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
customElements.define('product-item', ProductItem);`}],
		},
		stats: { maintainability: 0, portability: 0 },
		serviceType: null,
		startPos: { x: 50, y: 15 },
		exitZone: { x: 95, y: 50, width: 10, height: 20, label: 'The Shadow Threshold' },
		backgroundStyle: `url('/assets/hall-of-fragments/background.png') center / cover no-repeat`,
		npc: { name: "Fragments' Oracle", icon: "user", image: "/assets/hall-of-fragments/npc.png", position: { x: 50, y: 40 } },
		reward: { name: "Garments", icon: "shirt", image: "/assets/hall-of-fragments/reward.png", position: { x: 60, y: 45 } },
		hero: { image: "/assets/hall-of-fragments/hero.png", reward: "/assets/hall-of-fragments/hero-reward.png" }
	}
};
