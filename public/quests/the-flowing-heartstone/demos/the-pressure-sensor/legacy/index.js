// @ts-nocheck
import { html, LitElement } from "lit";

// 1. The root component holds state to share it
class CityApp extends LitElement {
	static properties = {
		pedestrians: { state: true },
	};

	constructor() {
		super();
		this.pedestrians = false;
	}

	// 2. Re-evaluates the entire template to pass the prop down
	render() {
		return html`
      <!-- lit-analyzer-disable-next-line -->
      <traffic-light .isRed=${this.pedestrians}></traffic-light>
      <pedestrian-sensor @presence=${(e) => (this.pedestrians = e.detail)}></pedestrian-sensor>
    `;
	}
}
customElements.define("city-app", CityApp);

// 3. The traffic light obediently waits for its parent to pass the prop
/**
 * @element traffic-light
 * @prop {boolean} isRed
 */
class TrafficLight extends LitElement {
	static properties = {
		isRed: { type: Boolean },
	};

	constructor() {
		super();
		this.isRed = false;
	}

	render() {
		return html`<div class="light">${this.isRed ? "🔴" : "🟢"}</div>`;
	}
}
customElements.define("traffic-light", TrafficLight);

// 4. The sensor sends the request upwards via events
class PedestrianSensor extends LitElement {
	render() {
		return html`
      <div class="crosswalk-zone"
        @mouseenter=${() => this.dispatchEvent(new CustomEvent("presence", { detail: true, bubbles: true, composed: true }))}
        @mouseleave=${() => this.dispatchEvent(new CustomEvent("presence", { detail: false, bubbles: true, composed: true }))}>
        Hover to trigger sensor
      </div>
    `;
	}
}
customElements.define("pedestrian-sensor", PedestrianSensor);
