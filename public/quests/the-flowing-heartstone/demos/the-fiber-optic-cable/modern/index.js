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
	}

	render() {
		this.renderCount++;
		console.log(
			"Renderizado TODO el árbol del componente. Count:",
			this.renderCount,
		);

		// Generar cientos de nodos inútiles
		const heavyTree = Array(100)
			.fill(0)
			.map(() => html`<div class="node"></div>`);

		// watch() conecta el Signal directamente al text node en concreto.
		// Lit reacciona al signal actualizando SOLO esa pequeña parte, sin volver a llamar a render()!
		const lightSignal = new Signal.Computed(() =>
			isTrafficJam.get() ? "🔴" : "🟢",
		);

		return html`
      <div class="intersection">
        <h3>Intersección Central</h3>
        <div>${heavyTree}</div>
        <span class="light">${watch(lightSignal)}</span>
        <div>${heavyTree}</div>
      </div>
      <div class="logs">Render count: ${this.renderCount}<br>El componente se renderiza UNA sola vez. Luego la señal altera directamente el DOM del emoji con coste O(1).</div>
    `;
	}
}
customElements.define("city-intersection", CityIntersection);
