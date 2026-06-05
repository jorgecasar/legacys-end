import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

const ambulance = new Signal.State(false);
const traffic = new Signal.State(false);

let evaluationCount = 0;

// The Signal DAG guarantees atomic consistency without tearing
const isEmergency = new Signal.Computed(() => {
	evaluationCount++;
	return ambulance.get() && traffic.get();
});

class CityDispatcher extends SignalWatcher(LitElement) {
	onEmergency() {
		// Reset everything to see the effect
		ambulance.set(false);
		traffic.set(false);
		evaluationCount = 0;

		// We mutate both states synchronously, one after the other
		ambulance.set(true);
		traffic.set(true);

		// ✅ Atomic Consistency ✅: Signals mark nodes as dirty (Push phase),
		// but they DO NOT trigger uncontrolled executions.
		// The system waits to stabilize (Pull phase).
	}

	render() {
		// When reading the value (Pull phase), the entire graph evaluates.
		// The Computed function executes EXACTLY ONCE with the final consistent state.
		const emergencyValue = isEmergency.get();

		return html`
      <div class="hub">
        <h2>Control Center (Signals)</h2>
        <p style="font-style: italic; color: #34d399; font-size: 0.9rem">(Rule: Emergency requires both Ambulance and Traffic to be TRUE)</p>
        <button @click=${this.onEmergency}>Trigger Emergency (Synchronous)</button>
        <div class="history">
          <h4>Single Atomic Evaluation:</h4>
          <p>Ambulance: ${ambulance.get()}, Traffic: ${traffic.get()} -> 🚨 Emergency: ${emergencyValue} | ✅ Correct final state reached.</p>
          <p style="color: #34d399">Number of times the Computed re-evaluated the heavy rule: ${evaluationCount}</p>
        </div>
      </div>
      <div class="logs">
        When clicking the button, both mutations simply mark the graph as dirty. The emergency Computed smartly "waits" and evaluates the result EXACTLY ONCE with the final data. No glitches, no half-baked calculations, saving CPU and preventing errors.
      </div>
    `;
	}
}
customElements.define("city-dispatcher", CityDispatcher);
