import { html, LitElement } from "lit";
import { cityState } from "./store.js";

class FuseBox extends LitElement {
	static properties = {
		_cars: { type: Number },
	};

	constructor() {
		super();
		this._cars = cityState.cars;
	}

	connectedCallback() {
		super.connectedCallback();
		this.timer = setInterval(() => {
			// Simula el tráfico normal, pero si alguien más mutó el store,
			// el valor estará corrupto permanentemente.
			cityState.cars += 1;
			this._cars = cityState.cars;
		}, 1000);
	}

	render() {
		const isHacked = this._cars < 0;
		return html`
      <div class="box">
        <h3>Panel de Control Principal</h3>
        <h2>Coches registrados: <span class="${isHacked ? "hacked" : ""}">${this._cars}</span></h2>
      </div>
    `;
	}
}
customElements.define("fuse-box", FuseBox);

class RookieComponent extends LitElement {
	breakCity() {
		// 🚨 Un componente periférico novato puede destruir la fuente de verdad
		cityState.cars = -9999;
	}

	render() {
		return html`
      <div style="margin-top: 2rem; text-align: center;">
        <p>Módulo de Control Externo</p>
        <button @click=${this.breakCity}>Sobreescribir datos sin permiso</button>
      </div>
    `;
	}
}
customElements.define("rookie-component", RookieComponent);
