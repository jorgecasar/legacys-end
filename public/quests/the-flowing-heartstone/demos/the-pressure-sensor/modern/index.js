import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

// 1. State lives autonomously and globally
export const pedestriansWaiting = new Signal.State(false);

// 2. CityApp ya NO tiene estado. NUNCA sufre re-render.
class CityApp extends LitElement {
	render() {
		return html`
      <traffic-light></traffic-light>
      <pedestrian-sensor></pedestrian-sensor>
    `;
	}
}
customElements.define("city-app", CityApp);

// 3. The traffic light reacts independently to the signal
class TrafficLight extends SignalWatcher(LitElement) {
	render() {
		return html`<div class="light">${pedestriansWaiting.get() ? "🔴" : "🟢"}</div>`;
	}
}
customElements.define("traffic-light", TrafficLight);

// 4. The sensor mutates the signal locally
class PedestrianSensor extends LitElement {
	render() {
		return html`
      <div class="crosswalk-zone"
        @mouseenter=${() => pedestriansWaiting.set(true)}
        @mouseleave=${() => pedestriansWaiting.set(false)}>
        Hover to trigger sensor
      </div>
    `;
	}
}
customElements.define("pedestrian-sensor", PedestrianSensor);
