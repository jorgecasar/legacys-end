import { html, LitElement } from "lit";

let globalCars = 0;
setInterval(() => {
	globalCars = Math.floor(Math.random() * 100);
}, 2000);

function calculateHeavyTrafficRules(cars) {
	const log = console.log;
	log("Calculating heavy rules... (Evaluated unconditionally)");
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
		// 🔴 Wastes CPU: Evaluates logic constantly even if no one is looking
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
        ${this.showTraffic ? "Hide Traffic" : "Show Traffic"}
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
          (Monitor Off)
        </div>
      `
			}
      
      <div class="logs">Open the console (F12). Watch how CPU is still wasted even when the monitor is turned off.</div>
    `;
	}
}
customElements.define("traffic-monitor", TrafficMonitor);
