// @ts-nocheck
import { html, LitElement } from "lit";

// 1. El componente raíz guarda el estado para compartirlo
class CityApp extends LitElement {
	static properties = {
		pedestrians: { state: true },
	};

	constructor() {
		super();
		this.pedestrians = false;
	}

	// 2. Re-evalúa el template entero para pasar la prop hacia abajo
	render() {
		console.log("render CiryApp");
		return html`
      <!-- lit-analyzer-disable-next-line -->
      <traffic-light .isRed=${this.pedestrians}></traffic-light>
      <pedestrian-sensor @presence=${(e) => (this.pedestrians = e.detail)}></pedestrian-sensor>
    `;
	}
}
customElements.define("city-app", CityApp);

// 3. El semáforo espera dócilmente a que su padre le pase la prop
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

// 4. El sensor manda la petición hacia arriba mediante eventos
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
