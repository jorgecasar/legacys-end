import { html, LitElement } from "lit";

class CityIntersection extends LitElement {
	static properties = {
		isJam: { type: Boolean },
	};

	constructor() {
		super();
		this.isJam = false;
		this.renderCount = 0;

		// GOOD PRACTICE: We cache the static tree to avoid generating new objects on each render.
		// However, Lit still needs to iterate over all 1000 items to verify nothing changed.
		this.staticCityGrid = Array(1000)
			.fill(0)
			.map((_, i) => html`<div class="node" title="Sector ${i}"></div>`);
	}

	connectedCallback() {
		super.connectedCallback();
		this.interval = setInterval(() => {
			this.isJam = !this.isJam;
		}, 1500);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearInterval(this.interval);
	}

	render() {
		this.renderCount++;

		return html`
			<div class="intersection">
				<h3>Central Intersection</h3>
				<div class="grid-container">
					${this.staticCityGrid}
				</div>
				<!-- This is the only node that actually needs to update -->
				<span class="light">${this.isJam ? "🔴" : "🟢"}</span>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				Even when caching 1000 static nodes (a good practice), the framework must still iterate and diff all of them on every cycle just to update this peripheral traffic light.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
