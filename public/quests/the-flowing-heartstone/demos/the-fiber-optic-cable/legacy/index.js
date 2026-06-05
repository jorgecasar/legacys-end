import { html, LitElement } from "lit";

class CityIntersection extends LitElement {
	static properties = {
		isJam: { type: Boolean },
	};

	constructor() {
		super();
		this.isJam = false;
		this.renderCount = 0;

		// BUENA PRÁCTICA: Cacheamos el árbol estático para no generar nuevos objetos en cada render.
		// Sin embargo, Lit tiene que iterar sobre los 1000 elementos para comprobar si han cambiado.
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
				<h3>Intersección Central</h3>
				<div class="grid-container">
					${this.staticCityGrid}
				</div>
				<!-- Este es el único nodo que realmente necesita cambiar -->
				<span class="light">${this.isJam ? "🔴" : "🟢"}</span>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				Incluso cacheando los 1000 nodos estáticos (buena práctica), el framework debe iterar y compararlos todos en cada ciclo solo para cambiar este semáforo periférico.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
