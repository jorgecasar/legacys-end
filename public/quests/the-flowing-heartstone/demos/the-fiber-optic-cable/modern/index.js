import { watch } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

const isTrafficJam = new Signal.State(false);
setInterval(() => {
	isTrafficJam.set(!isTrafficJam.get());
}, 1500);

class CityIntersection extends LitElement {
	constructor() {
		super();
		this.renderCount = 0;

		// GOOD PRACTICE: We cache the static city map
		this.staticCityGrid = Array(1000)
			.fill(0)
			.map((_, i) => html`<div class="node" title="Sector ${i}"></div>`);
	}

	render() {
		this.renderCount++;

		const lightSignal = new Signal.Computed(() =>
			isTrafficJam.get() ? "🔴" : "🟢",
		);

		return html`
			<div class="intersection">
				<h3>Central Intersection</h3>
				<div class="grid-container">
					${this.staticCityGrid}
				</div>
				<!-- watch() acts as a direct fiber optic cable to this exact node -->
				<span class="light">${watch(lightSignal)}</span>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				With Signals, render() executes exactly ONCE. The light state travels through the "watch" fiber optic cable directly to the DOM, completely bypassing the 1000-node iteration. Pure O(1) updates.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
