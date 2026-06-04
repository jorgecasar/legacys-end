import { html, LitElement } from "lit";

// 1. Un Store global clásico basado en eventos (muy común en Legacy)
class NaiveStore extends EventTarget {
	constructor() {
		super();
		this.ambulance = false;
		this.traffic = false;
	}
	setAmbulance(val) {
		this.ambulance = val;
		this.dispatchEvent(new Event("change")); // Notifica síncronamente
	}
	setTraffic(val) {
		this.traffic = val;
		this.dispatchEvent(new Event("change")); // Notifica síncronamente
	}
}
const store = new NaiveStore();

class CityDispatcher extends LitElement {
	static properties = { logs: { type: Array } };

	constructor() {
		super();
		this.logs = [];
	}

	connectedCallback() {
		super.connectedCallback();
		store.addEventListener("change", () => {
			// 2. Evaluamos el estado derivado en cuanto cambia el store
			const isEmergency = store.ambulance && store.traffic;

			let explanation = "";
			if (store.ambulance === true && store.traffic === false) {
				explanation =
					"❌ ¡GLITCH! La app reacciona antes de tiempo a un estado a medias.";
			} else if (store.ambulance === true && store.traffic === true) {
				explanation = "✅ Estado final correcto alcanzado.";
			}

			this.logs = [
				...this.logs,
				`Ambulancia: ${store.ambulance}, Tráfico: ${store.traffic} -> 🚨 Emergencia: ${isEmergency} | ${explanation}`,
			];
		});
	}

	onEmergency() {
		this.logs = []; // Limpiamos para ver el efecto

		// 3. Mutamos las dos propiedades de forma síncrona, una detrás de otra
		store.setAmbulance(true);
		// 🚨 GLITCH ("Tearing"): Al ejecutar la línea anterior, el evento YA saltó.
		// El sistema ya calculó el estado roto (A=true, T=false) antes de llegar aquí abajo.
		store.setTraffic(true);
	}

	render() {
		return html`
      <div class="hub">
        <h2>Centro de Control (Legacy)</h2>
        <p style="font-style: italic; color: #a1a1aa; font-size: 0.9rem">(Regla: Emergencia requiere que Ambulancia y Tráfico sean TRUE)</p>
        <button @click=${this.onEmergency}>Desatar Emergencia (Síncrona)</button>
        <div class="history">
          <h4>Evaluaciones del Sistema:</h4>
          ${this.logs.map((l) => html`<p>${l}</p>`)}
        </div>
      </div>
      <div class="logs">
        Al estar basado en eventos síncronos, la app reacciona en el exacto milisegundo en el que cambia la ambulancia. 
        Calcula y renderiza todo usando un estado intermedio roto (true/false) antes de que al código le dé tiempo a ejecutar la siguiente línea (tráfico). Esto gasta el doble de CPU y genera "glitches" visuales.
      </div>
    `;
	}
}
customElements.define("city-dispatcher", CityDispatcher);
