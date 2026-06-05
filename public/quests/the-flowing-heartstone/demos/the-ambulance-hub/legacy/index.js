import { html, LitElement } from "lit";

// 1. A classic event-based global Store (very common in Legacy)
class NaiveStore extends EventTarget {
	constructor() {
		super();
		this.ambulance = false;
		this.traffic = false;
	}
	setAmbulance(val) {
		this.ambulance = val;
		this.dispatchEvent(new Event("change")); // Synchronous notification
	}
	setTraffic(val) {
		this.traffic = val;
		this.dispatchEvent(new Event("change")); // Synchronous notification
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
			// 2. We evaluate derived state as soon as the store changes
			const isEmergency = store.ambulance && store.traffic;

			let explanation = "";
			if (store.ambulance === true && store.traffic === false) {
				explanation =
					"❌ GLITCH! The app reacts prematurely to a half-baked state.";
			} else if (store.ambulance === true && store.traffic === true) {
				explanation = "✅ Correct final state reached.";
			}

			this.logs = [
				...this.logs,
				`Ambulance: ${store.ambulance}, Traffic: ${store.traffic} -> 🚨 Emergency: ${isEmergency} | ${explanation}`,
			];
		});
	}

	onEmergency() {
		this.logs = []; // Clear to see the effect

		// 3. We synchronously mutate both properties, one after the other
		store.setAmbulance(true);
		// 🚨 GLITCH ("Tearing"): When the previous line runs, the event has ALREADY fired.
		// The system already calculated the broken state (A=true, T=false) before reaching this line.
		store.setTraffic(true);
	}

	render() {
		return html`
      <div class="hub">
        <h2>Control Center (Legacy)</h2>
        <p style="font-style: italic; color: #a1a1aa; font-size: 0.9rem">(Rule: Emergency requires both Ambulance and Traffic to be TRUE)</p>
        <button @click=${this.onEmergency}>Trigger Emergency (Synchronous)</button>
        <div class="history">
          <h4>System Evaluations:</h4>
          ${this.logs.map((l) => html`<p>${l}</p>`)}
        </div>
      </div>
      <div class="logs">
        Being based on synchronous events, the app reacts the exact millisecond the ambulance state changes. 
        It calculates and renders everything using a broken intermediate state (true/false) before the code has time to execute the next line (traffic). This doubles CPU usage and causes visual tearing.
      </div>
    `;
	}
}
customElements.define("city-dispatcher", CityDispatcher);
