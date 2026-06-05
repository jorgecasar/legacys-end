import { html, LitElement } from "lit";

class CityIntersection extends LitElement {
	static properties = {
		activeCars: { type: Number },
	};

	constructor() {
		super();
		this.activeCars = 0;
		this.renderCount = 0;

		// BUENA PRÁCTICA: Cacheamos el árbol estático para no generar nuevos objetos en cada render.
		// Sin embargo, Lit tiene que iterar sobre los 1000 elementos para comprobar si han cambiado.
		this.staticCityGrid = Array(1000)
			.fill(0)
			.map((_, i) => html`<div class="node" title="Sector ${i}"></div>`);
	}

	connectedCallback() {
		super.connectedCallback();
		// Simular actualizaciones de alta frecuencia (60 fps)
		this.interval = setInterval(() => {
			this.activeCars = (this.activeCars + 1) % 1000;
		}, 16);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearInterval(this.interval);
	}

	render() {
		this.renderCount++;

		return html`
			<div class="intersection">
				<h3>Control de Tráfico</h3>
				<p>Coches activos: <strong>${this.activeCars}</strong></p>
				<div class="grid-container">
					${this.staticCityGrid}
				</div>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				Incluso cacheando el HTML (buena práctica), actualizar el contador a 60fps fuerza a Lit a ejecutar render() e iterar sobre los 1000 nodos estáticos en cada ciclo.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
