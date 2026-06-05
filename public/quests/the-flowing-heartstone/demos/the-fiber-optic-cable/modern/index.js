import { watch } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

const activeCars = new Signal.State(0);
// Simular actualizaciones de alta frecuencia (60 fps)
setInterval(() => {
	activeCars.set((activeCars.get() + 1) % 1000);
}, 16);

class CityIntersection extends LitElement {
	constructor() {
		super();
		this.renderCount = 0;

		// BUENA PRÁCTICA: Cacheamos el árbol estático
		this.staticCityGrid = Array(1000)
			.fill(0)
			.map((_, i) => html`<div class="node" title="Sector ${i}"></div>`);
	}

	render() {
		this.renderCount++;

		return html`
			<div class="intersection">
				<h3>Control de Tráfico</h3>
				<p>Coches activos: <strong>${watch(activeCars)}</strong></p>
				<div class="grid-container">
					${this.staticCityGrid}
				</div>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				Con Signals, render() se ejecuta UNA SOLA VEZ. Las 60 actualizaciones por segundo viajan directamente al DOM ("${watch(activeCars)}"), esquivando la iteración de Lit sobre el array cacheado de 1000 nodos. O(1) puro.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
