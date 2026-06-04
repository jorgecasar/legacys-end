import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { Signal } from "signal-polyfill";

const ambulance = new Signal.State(false);
const traffic = new Signal.State(false);

let evaluationCount = 0;

// El DAG de señales garantiza consistencia atómica sin tearing
const isEmergency = new Signal.Computed(() => {
	evaluationCount++;
	return ambulance.get() && traffic.get();
});

class CityDispatcher extends SignalWatcher(LitElement) {
	onEmergency() {
		// Reiniciamos todo para ver el efecto
		ambulance.set(false);
		traffic.set(false);
		evaluationCount = 0;

		// Mutamos los dos estados uno detrás del otro de forma síncrona
		ambulance.set(true);
		traffic.set(true);

		// ✅ Consistencia Atómica ✅: Las señales marcan los nodos como sucios (Push),
		// pero NO disparan ejecuciones descontroladas.
		// El sistema espera a estabilizarse (Pull).
	}

	render() {
		// Al pedir el valor (Pull), el grafo entero se evalúa.
		// La función Computed se ejecuta UNA sola vez con el estado final consistente.
		const emergencyValue = isEmergency.get();

		return html`
      <div class="hub">
        <h2>Centro de Control (Signals)</h2>
        <p style="font-style: italic; color: #34d399; font-size: 0.9rem">(Regla: Emergencia requiere que Ambulancia y Tráfico sean TRUE)</p>
        <button @click=${this.onEmergency}>Desatar Emergencia (Síncrona)</button>
        <div class="history">
          <h4>Evaluación Única y Atómica:</h4>
          <p>Ambulancia: ${ambulance.get()}, Tráfico: ${traffic.get()} -> 🚨 Emergencia: ${emergencyValue} | ✅ Estado final correcto alcanzado.</p>
          <p style="color: #34d399">Nº de veces que la Computed reevaluó la regla pesada: ${evaluationCount}</p>
        </div>
      </div>
      <div class="logs">
        Al pulsar el botón, las dos mutaciones simplemente ensucian el grafo. La Computed de emergencia "espera" de forma inteligente y evalúa el resultado UNA SOLA VEZ con los datos finales. No hay glitches ni cálculos a medias, ahorrando CPU y previniendo errores.
      </div>
    `;
	}
}
customElements.define("city-dispatcher", CityDispatcher);
