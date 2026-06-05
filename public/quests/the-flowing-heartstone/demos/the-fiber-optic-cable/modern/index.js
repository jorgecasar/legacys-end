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

		// BUENA PRÁCTICA: Cacheamos el mapa de la ciudad
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
				<h3>Intersección Central</h3>
				<div class="grid-container">
					${this.staticCityGrid}
				</div>
				<!-- watch() actúa como un cable de fibra óptica directo a este nodo -->
				<span class="light">${watch(lightSignal)}</span>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				Con Signals, render() se ejecuta UNA SOLA VEZ. La luz cambia a través del cable de fibra óptica ("watch") directo al DOM, esquivando completamente la iteración de los 1000 nodos. O(1) puro.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
