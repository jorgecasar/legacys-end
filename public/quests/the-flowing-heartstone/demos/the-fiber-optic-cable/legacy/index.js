import { html, LitElement } from "lit";

class CityIntersection extends LitElement {
	static properties = {
		isJam: { type: Boolean },
	};

	constructor() {
		super();
		this.isJam = false;
		this.renderCount = 0;
	}

	connectedCallback() {
		super.connectedCallback();
		setInterval(() => {
			this.isJam = !this.isJam;
		}, 1500);
	}

	render() {
		this.renderCount++;
		console.log(
			"Renderizado TODO el árbol del componente. Count:",
			this.renderCount,
		);

		// Simular una UI pesada forzando a Lit a recalcular nodos en cada render
		const heavyTree = Array(500)
			.fill(0)
			.map(
				() => html`<div class="node" data-update-id="${Math.random()}"></div>`,
			);

		return html`
      <div class="intersection">
        <h3>Intersección Central</h3>
        <div>${heavyTree}</div>
        <span class="light">${this.isJam ? "🔴" : "🟢"}</span>
        <div>${heavyTree}</div>
      </div>
      <div class="logs">Render count: ${this.renderCount}<br>El framework debe recalcular toda la plantilla (incluyendo componentes pesados) en cada render, solo para cambiar un emoji.</div>
    `;
	}
}
customElements.define("city-intersection", CityIntersection);
