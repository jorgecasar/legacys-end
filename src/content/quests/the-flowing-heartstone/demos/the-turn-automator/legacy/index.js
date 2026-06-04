import { css, html, LitElement } from "lit";

let globalCars = 0;
setInterval(() => {
	globalCars = Math.floor(Math.random() * 100);
}, 2000);

function calculateHeavyTrafficRules(cars) {
	console.log("Calculando reglas pesadas... (Evaluado incondicionalmente)");
	return cars > 50;
}

class TrafficMonitor extends LitElement {
	static properties = {
		isJam: { type: Boolean },
		showTraffic: { type: Boolean },
	};

	constructor() {
		super();
		this.isJam = false;
		this.showTraffic = true;
	}

	connectedCallback() {
		super.connectedCallback();
		// 🔴 Desperdicia CPU: Evalúa la lógica constantemente aunque nadie lo esté mirando
		this.timer = setInterval(() => {
			this.isJam = calculateHeavyTrafficRules(globalCars);
		}, 1000);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearInterval(this.timer);
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
          Status: ${this.isJam ? "🔴 JAM" : "🟢 OK"}
        </div>
      `
					: html`
        <div class="monitor off">
          (Monitor Apagado)
        </div>
      `
			}
      
      <div class="logs">Abre la consola (F12). Observa cómo la CPU se sigue desperdiciando aunque el monitor esté apagado.</div>
    `;
	}
}
customElements.define("traffic-monitor", TrafficMonitor);
