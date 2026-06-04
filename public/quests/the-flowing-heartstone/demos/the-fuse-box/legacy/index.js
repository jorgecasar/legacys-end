import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { cityState } from "./store.js";

class FuseBox extends SignalWatcher(LitElement) {
	connectedCallback() {
		super.connectedCallback();
		this.timer = setInterval(() => {
			// Simula el tráfico normal mutando el signal directamente
			cityState.cars.set(cityState.cars.get() + 1);
		}, 1000);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearInterval(this.timer);
	}

	render() {
		const isHacked = cityState.cars.get() < 0;
		return html`
      <div class="box">
        <h3>Panel de Control Principal</h3>
        <h2>Coches registrados: <span class="${isHacked ? "hacked" : ""}">${cityState.cars.get()}</span></h2>
      </div>
    `;
	}
}
customElements.define("fuse-box", FuseBox);

class RookieComponent extends LitElement {
	breakCity() {
		// 🚨 Un componente periférico novato puede hacer set a un signal expuesto públicamente
		cityState.cars.set(-9999);
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
