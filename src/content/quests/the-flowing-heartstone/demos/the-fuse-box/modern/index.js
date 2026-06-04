import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { store } from "./store.js";

class FuseBox extends SignalWatcher(LitElement) {
	connectedCallback() {
		super.connectedCallback();
		this.timer = setInterval(() => {
			// Usamos el método oficial del Store
			store.registerVehicle();
		}, 1000);
	}

	render() {
		return html`
      <div class="box">
        <h3>Panel de Control Principal</h3>
        <h2>Coches registrados: <span>${store.cars.get()}</span></h2>
      </div>
    `;
	}
}
customElements.define("fuse-box", FuseBox);

class RookieComponent extends LitElement {
	breakCity() {
		try {
			// 🚨 Intento fallido de hackeo:
			// Property '#cars' is not accessible.
			// store.cars es un Computed, NO TIENE .set()!
			store.cars.set(-9999);
		} catch (e) {
			console.error("Hackeo prevenido por el Store!", e.message);
			alert("⚠️ Error: " + e.message);
		}
	}

	render() {
		return html`
      <div style="margin-top: 2rem; text-align: center;">
        <p>Módulo de Control Externo</p>
        <button @click=${this.breakCity}>Intentar hackear el Store</button>
      </div>
      <div class="logs">El state original está protegido. Solo exponemos espejos seguros.</div>
    `;
	}
}
customElements.define("rookie-component", RookieComponent);
