import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

const carCount = new Signal.State(0);
// Simulamos que los datos subyacentes cambian constantemente en segundo plano
setInterval(() => {
	carCount.set(Math.floor(Math.random() * 100));
}, 2000);

function calculateHeavyTrafficRules(cars) {
	console.log(
		"✅ Calculando reglas pesadas... (Solo ocurre cuando alguien lee el Computed!)",
	);
	return cars > 50;
}

// 🟢 Computed es Perezoso (Lazy): NO evalúa nada hasta que alguien hace .get()
const isTrafficJam = new Signal.Computed(() => {
	return calculateHeavyTrafficRules(carCount.get());
});

class TrafficMonitor extends SignalWatcher(LitElement) {
	static properties = {
		showTraffic: { type: Boolean },
	};

	constructor() {
		super();
		this.showTraffic = true;
	}

	render() {
		return html`
      <button @click=${() => (this.showTraffic = !this.showTraffic)}>
        ${this.showTraffic ? "Ocultar Tráfico" : "Mostrar Tráfico"}
      </button>

      ${
				this.showTraffic
					? html`
        <div class="monitor">
          <!-- Al hacer .get(), Lit se suscribe y el Computed se evalúa de forma perezosa -->
          Status: ${isTrafficJam.get() ? "🔴 JAM" : "🟢 OK"}
        </div>
      `
					: html`
        <div class="monitor off">
          <!-- Aquí NUNCA llamamos a isTrafficJam.get(), así que la CPU se ahorra al 100% -->
          (Monitor Apagado)
        </div>
      `
			}

      <div class="logs">Abre la consola (F12). Apaga el monitor y verás cómo el cálculo se detiene mágicamente, aunque los coches sigan cambiando en segundo plano.</div>
    `;
	}
}
customElements.define("traffic-monitor", TrafficMonitor);
