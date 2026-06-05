import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

const carCount = new Signal.State(0);
// Simulate underlying data changing constantly in the background
setInterval(() => {
	carCount.set(Math.floor(Math.random() * 100));
}, 2000);

function calculateHeavyTrafficRules(cars) {
	window.console.log(
		"✅ Calculating heavy rules... (Only happens when someone reads the Computed!)",
	);
	return cars > 50;
}

// 🟢 Computed is Lazy: It evaluates NOTHING until someone calls .get()
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
        ${this.showTraffic ? "Hide Traffic" : "Show Traffic"}
      </button>

      ${
				this.showTraffic
					? html`
        <div class="monitor">
          <!-- By calling .get(), Lit subscribes and the Computed evaluates lazily -->
          Status: ${isTrafficJam.get() ? "🔴 JAM" : "🟢 OK"}
        </div>
      `
					: html`
        <div class="monitor off">
          <!-- We NEVER call isTrafficJam.get() here, so CPU is 100% saved -->
          (Monitor Off)
        </div>
      `
			}

      <div class="logs">Open the console (F12). Turn off the monitor and watch how the calculation magically stops, even while cars keep changing in the background.</div>
    `;
	}
}
customElements.define("traffic-monitor", TrafficMonitor);
