import { msg } from "@lit/localize";
import { TrafficLightStates, ZoneTypes } from "../../../core/constants.js";

/**
 * The Flowing Heartstone Quest - Chapter Data
 *
 * This quest focuses on TC39 Signals and Fine-grained Reactivity:
 * - the-pressure-sensor: Signal.State (Autonomous Data)
 * - the-turn-automator: Signal.Computed (Lazy Logic)
 * - the-fiber-optic-cable: Signal.subtle.Watcher (Direct DOM binding)
 * - the-ambulance-hub: The Logic Graph (Atomic Consistency / Glitch-free)
 * - the-fuse-box: Store Governance (Read-only projections)
 */

/** @typedef {import("../quest-types.js").LevelConfig} LevelConfig */

/** @returns {Record<string, LevelConfig>} */
export const getTheFlowingHeartstoneChapters = () => ({
	"the-pressure-sensor": {
		id: "the-pressure-sensor",
		title: msg("The Pedestrian Crossing"),
		description: msg(
			"I'm isolating this pressure sensor. It was so chained to the core grid that a simple footstep caused the entire intersection to collapse and redraw. Step closer, I'll teach you how to decouple it.",
		),
		zones: [
			{
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				type: ZoneTypes.TRAFFIC_LIGHT_CHANGE,
				payload: TrafficLightStates.GREEN,
			},
			{
				x: 20,
				y: 67.5,
				width: 55,
				height: 16,
				type: ZoneTypes.TRAFFIC_LIGHT_CHANGE,
				payload: TrafficLightStates.RED,
			},
			{
				x: 77,
				y: 32,
				width: 3.2,
				height: 3.2,
				type: ZoneTypes.TRAFFIC_LIGHT_RED,
				payload: null,
			},
			{
				x: 77,
				y: 42,
				width: 3.2,
				height: 3.2,
				type: ZoneTypes.TRAFFIC_LIGHT_GREEN,
				payload: null,
			},
		],
		problemTitle: msg("Before: Massive Re-rendering"),
		problemDesc: msg(
			"The sensor's state was shackled to the root of the UI tree through a massive global context. Consequently, every minor interaction detonated a shockwave that forced the framework to critically and unnecessarily re-render the entire intersection.",
		),
		solutionTitle: msg("After: The Autonomous Data"),
		architecturalChanges: [
			msg(
				"Signal.State: A pure reactive container that mutates in absolute silence.",
			),
			msg(
				"State outside the UI: Data lives in memory independently of the DOM lifecycle.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Events and Props)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';

// 1. El componente raíz guarda el estado para compartirlo
class CityApp extends LitElement {
  static properties = {
    pedestrians: { state: true }
  };

  constructor() {
    super();
    this.pedestrians = false;
  }

  // 2. Re-evalúa el template entero para pasar la prop hacia abajo
  render() {
	console.log('render CiryApp');
    return html\`
      <traffic-light .isRed=\${this.pedestrians}></traffic-light>
      <pedestrian-sensor @presence=\${(e) => this.pedestrians = e.detail}></pedestrian-sensor>
    \`;
  }
}
customElements.define('city-app', CityApp);

// 3. El semáforo espera dócilmente a que su padre le pase la prop
class TrafficLight extends LitElement {
  static properties = {
    isRed: { type: Boolean }
  };

  constructor() {
    super();
    this.isRed = false;
  }

  render() { return html\`<div class="light">\${this.isRed ? '🔴' : '🟢'}</div>\`; }
}
customElements.define('traffic-light', TrafficLight);

// 4. El sensor manda la petición hacia arriba mediante eventos
class PedestrianSensor extends LitElement {
  render() {
    return html\`
      <div class="crosswalk-zone"
        @mouseenter=\${() => this.dispatchEvent(new CustomEvent('presence', {detail: true, bubbles: true, composed: true}))}
        @mouseleave=\${() => this.dispatchEvent(new CustomEvent('presence', {detail: false, bubbles: true, composed: true}))}>
        Hover to trigger sensor
      </div>
    \`;
  }
}
customElements.define('pedestrian-sensor', PedestrianSensor);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .crosswalk-zone { padding: 2rem; border: 2px dashed #666; cursor: pointer; user-select: none; }
      .crosswalk-zone:hover { border-color: #0f0; background: rgba(0,255,0,0.1); }
      .light { font-size: 4rem; text-align: center; margin-bottom: 2rem; }
    </style>
  </head>
  <body>
    <city-app></city-app>
  </body>
</html>`,
					},
				},
			],
			end: [
				{
					title: msg("Modern Lit (TC39 Signals)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

// 1. El estado vive de forma autónoma y global
export const pedestriansWaiting = new Signal.State(false);

// 2. CityApp ya NO tiene estado. NUNCA sufre re-render.
class CityApp extends LitElement {
  render() {
	console.log('render CiryApp');
    return html\`
      <traffic-light></traffic-light>
      <pedestrian-sensor></pedestrian-sensor>
    \`;
  }
}
customElements.define('city-app', CityApp);

// 3. El semáforo reacciona independientemente a la señal
class TrafficLight extends SignalWatcher(LitElement) {
  render() {
    return html\`<div class="light">\${pedestriansWaiting.get() ? '🔴' : '🟢'}</div>\`;
  }
}
customElements.define('traffic-light', TrafficLight);

// 4. El sensor muta la señal de forma local
class PedestrianSensor extends LitElement {
  render() {
    return html\`
      <div class="crosswalk-zone"
        @mouseenter=\${() => pedestriansWaiting.set(true)}
        @mouseleave=\${() => pedestriansWaiting.set(false)}>
        Hover to trigger sensor
      </div>
    \`;
  }
}
customElements.define('pedestrian-sensor', PedestrianSensor);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .crosswalk-zone { padding: 2rem; border: 2px dashed #666; cursor: pointer; user-select: none; }
      .crosswalk-zone:hover { border-color: #0f0; background: rgba(0,255,0,0.1); }
      .light { font-size: 4rem; text-align: center; margin-bottom: 2rem; }
    </style>
  </head>
  <body>
    <city-app></city-app>
  </body>
</html>`,
					},
				},
			],
		},
		scale: 20,
		stats: { maintainability: 10, portability: 10, performance: 30 },
		backgroundStyle: `url('/assets/the-pressure-sensor/background.png')`,
		startPos: { x: 15, y: 100 },
		exitZone: { x: 15, y: 90, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Wiretapper"),
			image: "/assets/the-pressure-sensor/npc.png",
			position: { x: 80, y: 70 },
			requirements: {
				trafficLightState: {
					value: TrafficLightStates.GREEN,
					message: msg(
						"I have a detector on the crosswalk, and every footstep forces me to rebuild the entire intersection's matrix. Step out of the crosswalk so the light turns green and we can talk without overloading the system!",
					),
				},
			},
		},
		reward: {
			scale: 10,
			name: msg("Isolated Sensor"),
			image: "/assets/the-pressure-sensor/reward.png",
			position: { x: 95, y: 75 },
		},
		hero: { image: "/assets/the-pressure-sensor/hero.png" },
	},
	"the-turn-automator": {
		id: "the-turn-automator",
		title: msg("The Turn Automator"),
		description: msg(
			"What a disaster of efficiency! The core wastes energy calculating traffic density incessantly, even when the streets are empty. I'll show you how to forge a reactive intermediate node that remains dormant until its data is explicitly demanded.",
		),
		problemTitle: msg("Before: Eager Computation"),
		problemDesc: msg(
			"The legacy system suffered from eager evaluation, aggressively recalculating heavy derived state on every lifecycle heartbeat, draining precious CPU cycles even when all monitors were offline.",
		),
		solutionTitle: msg("After: Lazy Mirrors"),
		architecturalChanges: [
			msg("Signal.Computed: Derived data with native memoization."),
			msg(
				"Lazy Evaluation: The computational cost is ZERO if nobody extracts the computed value.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Eager)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html, css } from 'lit';

let globalCars = 0;
setInterval(() => { globalCars = Math.floor(Math.random() * 100); }, 2000);

function calculateHeavyTrafficRules(cars) {
  console.log("Calculando reglas pesadas... (Evaluado incondicionalmente)");
  return cars > 50;
}

class TrafficMonitor extends LitElement {
  static properties = {
    isJam: { type: Boolean },
    showTraffic: { type: Boolean }
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
    return html\`
      <button @click=\${() => this.showTraffic = !this.showTraffic}>
        \${this.showTraffic ? 'Ocultar Tráfico' : 'Mostrar Tráfico'}
      </button>

      \${this.showTraffic ? html\`
        <div class="monitor">
          Status: \${this.isJam ? '🔴 JAM' : '🟢 OK'}
        </div>
      \` : html\`
        <div class="monitor off">
          (Monitor Apagado)
        </div>
      \`}

      <div class="logs">Abre la consola (F12). Observa cómo la CPU se sigue desperdiciando aunque el monitor esté apagado.</div>
    \`;
  }
}
customElements.define('traffic-monitor', TrafficMonitor);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      button { background: #555; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-bottom: 1rem; }
      .monitor { font-size: 2rem; padding: 2rem; border: 2px dashed #666; text-align: center; }
      .monitor.off { color: #555; border-color: #333; }
      .logs { margin-top: 1rem; color: #a1a1aa; font-family: monospace; text-align: center; max-width: 300px; }
    </style>
  </head>
  <body>
    <traffic-monitor></traffic-monitor>
  </body>
</html>`
					}
				}
			],
			end: [
				{
					title: msg("Modern Lit (Lazy Computed)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

const carCount = new Signal.State(0);
// Simulamos que los datos subyacentes cambian constantemente en segundo plano
setInterval(() => { carCount.set(Math.floor(Math.random() * 100)); }, 2000);

function calculateHeavyTrafficRules(cars) {
  console.log("✅ Calculando reglas pesadas... (Solo ocurre cuando alguien lee el Computed!)");
  return cars > 50;
}

// 🟢 Computed es Perezoso (Lazy): NO evalúa nada hasta que alguien hace .get()
const isTrafficJam = new Signal.Computed(() => {
  return calculateHeavyTrafficRules(carCount.get());
});

class TrafficMonitor extends SignalWatcher(LitElement) {
  static properties = {
    showTraffic: { type: Boolean }
  };

  constructor() {
    super();
    this.showTraffic = true;
  }

  render() {
    return html\`
      <button @click=\${() => this.showTraffic = !this.showTraffic}>
        \${this.showTraffic ? 'Ocultar Tráfico' : 'Mostrar Tráfico'}
      </button>

      \${this.showTraffic ? html\`
        <div class="monitor">
          <!-- Al hacer .get(), Lit se suscribe y el Computed se evalúa de forma perezosa -->
          Status: \${isTrafficJam.get() ? '🔴 JAM' : '🟢 OK'}
        </div>
      \` : html\`
        <div class="monitor off">
          <!-- Aquí NUNCA llamamos a isTrafficJam.get(), así que la CPU se ahorra al 100% -->
          (Monitor Apagado)
        </div>
      \`}

      <div class="logs">Abre la consola (F12). Apaga el monitor y verás cómo el cálculo se detiene mágicamente, aunque los coches sigan cambiando en segundo plano.</div>
    \`;
  }
}
customElements.define('traffic-monitor', TrafficMonitor);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      button { background: #0f766e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-bottom: 1rem; }
      .monitor { font-size: 2rem; padding: 2rem; border: 2px dashed #0f766e; text-align: center; }
      .monitor.off { color: #1f3a3d; border-color: #1a2f30; }
      .logs { margin-top: 1rem; color: #34d399; font-family: monospace; text-align: center; max-width: 320px; }
    </style>
  </head>
  <body>
    <traffic-monitor></traffic-monitor>
  </body>
</html>`
					}
				}
			]
		},
		scale: 40,
		stats: { maintainability: 10, portability: 10, performance: 40 },
		backgroundStyle: `url('/assets/the-turn-automator/background.png')`,
		startPos: { x: 80, y: 20 },
		exitZone: { x: 90, y: 5, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Idle Engineer"),
			image: "/assets/the-turn-automator/npc.png",
			position: { x: 50, y: 70 },
		},
		reward: {
			scale: 15,
			name: msg("The Lazy Smart Chip"),
			image: "/assets/the-turn-automator/reward.png",
			position: { x: 38, y: 45 },
		},
		hero: { image: "/assets/the-turn-automator/hero.png" },
	},
	"the-fiber-optic-cable": {
		id: "the-fiber-optic-cable",
		title: msg("The Fiber Optic Cable"),
		description: msg(
			"Why yell to the whole city just to turn on a single traffic light? I'm threading a direct fiber optic filament right into its lens. Let me teach you how to bypass the framework's chaotic massive diffing.",
		),
		problemTitle: msg("Before: VDOM Diffing"),
		problemDesc: msg(
			"The legacy framework unleashed destructive 'diffing', blindly comparing hundreds of virtual nodes only to discover the sole required mutation was altering the text of a tiny <span> on the periphery.",
		),
		solutionTitle: msg("After: Surgical Notification"),
		architecturalChanges: [
			msg(
				"Signal.subtle.Watcher: Tracks dependencies to trigger targeted effects.",
			),
			msg(
				"Direct DOM Mutation: We bypass framework re-renders, updating the element with O(1) cost.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Template Diffing)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';

class CityIntersection extends LitElement {
  static properties = {
    isJam: { type: Boolean }
  };

  constructor() {
    super();
    this.isJam = false;
    this.renderCount = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    setInterval(() => {
      this.isJam = !this.isJam;
    }, 1500);
  }

  render() {
    this.renderCount++;
    console.log("Renderizado TODO el árbol del componente. Count:", this.renderCount);

    // Generar cientos de nodos inútiles para simular una UI pesada
    const heavyTree = Array(100).fill(0).map(() => html\`<div class="node"></div>\`);

    return html\`
      <div class="intersection">
        <h3>Intersección Central</h3>
        <div>\${heavyTree}</div>
        <span class="light">\${this.isJam ? '🔴' : '🟢'}</span>
        <div>\${heavyTree}</div>
      </div>
      <div class="logs">Render count: \${this.renderCount}<br>El framework debe procesar cientos de nodos en cada render, solo para cambiar un emoji.</div>
    \`;
  }
}
customElements.define('city-intersection', CityIntersection);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .intersection { border: 2px solid #555; padding: 2rem; border-radius: 10px; text-align: center; }
      .light { font-size: 3rem; margin: 1rem 0; display: block; }
      .node { display: inline-block; width: 10px; height: 10px; background: #444; margin: 2px; }
      .logs { margin-top: 1rem; color: #a1a1aa; font-family: monospace; max-width: 400px; text-align: center; }
    </style>
  </head>
  <body>
    <city-intersection></city-intersection>
  </body>
</html>`
					}
				}
			],
			end: [
				{
					title: msg("Modern Lit (Watch Directive)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';
import { SignalWatcher, watch } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

const isTrafficJam = new Signal.State(false);
setInterval(() => {
  isTrafficJam.set(!isTrafficJam.get());
}, 1500);

class CityIntersection extends LitElement {
  constructor() {
    super();
    this.renderCount = 0;
  }

  render() {
    this.renderCount++;
    console.log("Renderizado TODO el árbol del componente. Count:", this.renderCount);

    // Generar cientos de nodos inútiles
    const heavyTree = Array(100).fill(0).map(() => html\`<div class="node"></div>\`);

    // watch() conecta el Signal directamente al text node en concreto.
    // Lit reacciona al signal actualizando SOLO esa pequeña parte, sin volver a llamar a render()!
    const lightSignal = new Signal.Computed(() => isTrafficJam.get() ? '🔴' : '🟢');

    return html\`
      <div class="intersection">
        <h3>Intersección Central</h3>
        <div>\${heavyTree}</div>
        <span class="light">\${watch(lightSignal)}</span>
        <div>\${heavyTree}</div>
      </div>
      <div class="logs">Render count: \${this.renderCount}<br>El componente se renderiza UNA sola vez. Luego la señal altera directamente el DOM del emoji con coste O(1).</div>
    \`;
  }
}
customElements.define('city-intersection', CityIntersection);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .intersection { border: 2px solid #0f766e; padding: 2rem; border-radius: 10px; text-align: center; }
      .light { font-size: 3rem; margin: 1rem 0; display: block; }
      .node { display: inline-block; width: 10px; height: 10px; background: #444; margin: 2px; }
      .logs { margin-top: 1rem; color: #34d399; font-family: monospace; max-width: 400px; text-align: center; }
    </style>
  </head>
  <body>
    <city-intersection></city-intersection>
  </body>
</html>`
					}
				}
			],
		},
		scale: 30,
		stats: { maintainability: 20, portability: 10, performance: 50 },
		backgroundStyle: `url('/assets/the-fiber-optic-cable/background.png')`,
		startPos: { x: 30, y: 80 },
		exitZone: { x: 40, y: 10, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Fiber Weaver"),
			image: "/assets/the-fiber-optic-cable/npc.png",
			position: { x: 70, y: 60 },
		},
		reward: {
			scale: 12,
			name: msg("The Surgical Laser Splicer"),
			image: "/assets/the-fiber-optic-cable/reward.png",
			position: { x: 85, y: 65 },
		},
		hero: { image: "/assets/the-fiber-optic-cable/hero.png" },
	},
	"the-ambulance-hub": {
		id: "the-ambulance-hub",
		title: msg("The Ambulance Hub"),
		description: msg(
			"Event concurrency is fracturing our interface! An ambulance and a traffic spike have collided in memory. I'm stabilizing the main node to guarantee tear-free atomic updates. Watch closely!",
		),
		problemTitle: msg("Before: Glitchy Renders (Tearing)"),
		problemDesc: msg(
			"Isolated state mutations triggered the framework in multiple chaotic passes, causing dangerous visual 'tearing' where the screen displayed invalid and corrupted state frames.",
		),
		solutionTitle: msg("After: Atomic Consistency"),
		architecturalChanges: [
			msg(
				"DAG (Directed Acyclic Graph): Perfectly structures dependencies without cycles.",
			),
			msg(
				"Push/Pull Algorithm: Stabilizes the graph in blocks, guaranteeing the DOM updates only once atomically.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Tearing)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';

// 1. Un Store global clásico basado en eventos (muy común en Legacy)
class NaiveStore extends EventTarget {
  constructor() {
    super();
    this.ambulance = false;
    this.traffic = false;
  }
  setAmbulance(val) {
    this.ambulance = val;
    this.dispatchEvent(new Event('change')); // Notifica síncronamente
  }
  setTraffic(val) {
    this.traffic = val;
    this.dispatchEvent(new Event('change')); // Notifica síncronamente
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
    store.addEventListener('change', () => {
      // 2. Evaluamos el estado derivado en cuanto cambia el store
      const isEmergency = store.ambulance && store.traffic;

      let explanation = "";
      if (store.ambulance === true && store.traffic === false) {
        explanation = "❌ ¡GLITCH! La app reacciona antes de tiempo a un estado a medias.";
      } else if (store.ambulance === true && store.traffic === true) {
        explanation = "✅ Estado final correcto alcanzado.";
      }

      this.logs = [...this.logs, \`Ambulancia: \${store.ambulance}, Tráfico: \${store.traffic} -> 🚨 Emergencia: \${isEmergency} | \${explanation}\`];
    });
  }

  onEmergency() {
    this.logs = []; // Limpiamos para ver el efecto

    // 3. Mutamos las dos propiedades de forma síncrona, una detrás de otra
    store.setAmbulance(true);
    // 🚨 GLITCH ("Tearing"): Al ejecutar la línea anterior, el evento YA saltó.
    // El sistema ya calculó el estado roto (A=true, T=false) antes de llegar aquí abajo.
    store.setTraffic(true);
  }

  render() {
    return html\`
      <div class="hub">
        <h2>Centro de Control (Legacy)</h2>
        <p style="font-style: italic; color: #a1a1aa; font-size: 0.9rem">(Regla: Emergencia requiere que Ambulancia y Tráfico sean TRUE)</p>
        <button @click=\${this.onEmergency}>Desatar Emergencia (Síncrona)</button>
        <div class="history">
          <h4>Evaluaciones del Sistema:</h4>
          \${this.logs.map(l => html\`<p>\${l}</p>\`)}
        </div>
      </div>
      <div class="logs">
        Al estar basado en eventos síncronos, la app reacciona en el exacto milisegundo en el que cambia la ambulancia.
        Calcula y renderiza todo usando un estado intermedio roto (true/false) antes de que al código le dé tiempo a ejecutar la siguiente línea (tráfico). Esto gasta el doble de CPU y genera "glitches" visuales.
      </div>
    \`;
  }
}
customElements.define('city-dispatcher', CityDispatcher);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .hub { border: 2px solid #555; padding: 2rem; border-radius: 10px; text-align: center; width: 600px; }
      button { background: #f43f5e; color: white; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 8px; cursor: pointer; margin-top: 1rem; }
      button:active { transform: scale(0.95); }
      .history { margin-top: 2rem; text-align: left; background: #111; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; }
      .logs { margin-top: 1rem; color: #a1a1aa; font-family: monospace; max-width: 600px; text-align: left; }
    </style>
  </head>
  <body>
    <city-dispatcher></city-dispatcher>
  </body>
</html>`
					}
				}
			],
			end: [
				{
					title: msg("Modern Lit (Atomic Graph)"),
					interactive: true,
					files: {
						"index.js": `import { LitElement, html } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';

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
    ambulance.set(false); traffic.set(false); evaluationCount = 0;

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

    return html\`
      <div class="hub">
        <h2>Centro de Control (Signals)</h2>
        <p style="font-style: italic; color: #34d399; font-size: 0.9rem">(Regla: Emergencia requiere que Ambulancia y Tráfico sean TRUE)</p>
        <button @click=\${this.onEmergency}>Desatar Emergencia (Síncrona)</button>
        <div class="history">
          <h4>Evaluación Única y Atómica:</h4>
          <p>Ambulancia: \${ambulance.get()}, Tráfico: \${traffic.get()} -> 🚨 Emergencia: \${emergencyValue} | ✅ Estado final correcto alcanzado.</p>
          <p style="color: #34d399">Nº de veces que la Computed reevaluó la regla pesada: \${evaluationCount}</p>
        </div>
      </div>
      <div class="logs">
        Al pulsar el botón, las dos mutaciones simplemente ensucian el grafo. La Computed de emergencia "espera" de forma inteligente y evalúa el resultado UNA SOLA VEZ con los datos finales. No hay glitches ni cálculos a medias, ahorrando CPU y previniendo errores.
      </div>
    \`;
  }
}
customElements.define('city-dispatcher', CityDispatcher);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .hub { border: 2px solid #0f766e; padding: 2rem; border-radius: 10px; text-align: center; width: 600px; }
      button { background: #0f766e; color: white; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 8px; cursor: pointer; margin-top: 1rem; }
      button:active { transform: scale(0.95); }
      .history { margin-top: 2rem; text-align: left; background: #111; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; }
      .logs { margin-top: 1rem; color: #34d399; font-family: monospace; max-width: 600px; text-align: left; }
    </style>
  </head>
  <body>
    <city-dispatcher></city-dispatcher>
  </body>
</html>`
					}
				}
			],
		},
		stats: { maintainability: 30, portability: 10, performance: 20 },
		backgroundStyle: `url('/assets/the-ambulance-hub/background.png')`,
		startPos: { x: 10, y: 50 },
		exitZone: { x: 100, y: 50, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Chrono-Dispatcher"),
			image: "/assets/the-ambulance-hub/npc.png",
			position: { x: 85, y: 15 },
		},
		reward: {
			name: msg("The Atomic Chronometer"),
			image: "/assets/the-ambulance-hub/reward.png",
			position: { x: 50, y: 10 },
		},
		hero: { image: "/assets/the-ambulance-hub/hero.png" },
	},
	"the-fuse-box": {
		id: "the-fuse-box",
		title: msg("The Locked Fuse Box"),
		description: msg(
			"Integrity breach detected! The main network is fully exposed; any rookie module could overwrite raw traffic data. Help me lock this fuse box, and we'll expose only safe, read-only reactive mirrors.",
		),
		problemTitle: msg("Before: Global Mutable State"),
		problemDesc: msg(
			"A dangerously exposed and highly mutable global state. Any peripheral node in the application had the power to overwrite the source of truth, spawning near-impossible-to-track cascading failures.",
		),
		solutionTitle: msg("After: Store Governance"),
		architecturalChanges: [
			msg(
				"Private State: The real state is shielded in JS (#cars) so it cannot be mutated from the outside.",
			),
			msg(
				"Read-only Projections: Computed signals are exposed as safe, immutable mirrors for the UI.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Global Mutable State)"),
					interactive: true,
					files: {
						"store.js": `// Un estado global expuesto y altamente mutable
export const cityState = {
  cars: 0
};`,
						"index.js": `import { LitElement, html } from 'lit';
import { cityState } from './store.js';

class FuseBox extends LitElement {
  static properties = {
    _cars: { type: Number }
  };

  constructor() {
    super();
    this._cars = cityState.cars;
  }

  connectedCallback() {
    super.connectedCallback();
    this.timer = setInterval(() => {
      // Simula el tráfico normal, pero si alguien más mutó el store,
      // el valor estará corrupto permanentemente.
      cityState.cars += 1;
      this._cars = cityState.cars;
    }, 1000);
  }

  render() {
    const isHacked = this._cars < 0;
    return html\`
      <div class="box">
        <h3>Panel de Control Principal</h3>
        <h2>Coches registrados: <span class="\${isHacked ? 'hacked' : ''}">\${this._cars}</span></h2>
      </div>
    \`;
  }
}
customElements.define('fuse-box', FuseBox);

class RookieComponent extends LitElement {
  breakCity() {
    // 🚨 Un componente periférico novato puede destruir la fuente de verdad
    cityState.cars = -9999;
  }

  render() {
    return html\`
      <div style="margin-top: 2rem; text-align: center;">
        <p>Módulo de Control Externo</p>
        <button @click=\${this.breakCity}>Sobreescribir datos sin permiso</button>
      </div>
    \`;
  }
}
customElements.define('rookie-component', RookieComponent);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .box { border: 2px solid #555; padding: 2rem; border-radius: 10px; text-align: center; }
      .hacked { color: #f43f5e; font-weight: bold; }
      button { background: #f43f5e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem; }
      .logs { margin-top: 1rem; color: #a1a1aa; font-family: monospace; max-width: 400px; text-align: center; }
    </style>
  </head>
  <body>
    <fuse-box></fuse-box>
    <rookie-component></rookie-component>
  </body>
</html>`
					}
				}
			],
			end: [
				{
					title: msg("Modern Lit (Store Governance)"),
					interactive: true,
					files: {
						"store.js": `import { Signal } from 'signal-polyfill';

export class TrafficStore {
  // 🛡️ El estado real se encapsula privadamente (#)
  #cars = new Signal.State(0);

  constructor() {
    // 🛡️ Se expone un espejo seguro (Computed) de solo lectura
    this.cars = new Signal.Computed(() => this.#cars.get());
  }

  // Único método autorizado para mutar el estado
  registerVehicle() {
    this.#cars.set(this.#cars.get() + 1);
  }
}

export const store = new TrafficStore();
`,
						"index.js": `import { LitElement, html } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { store } from './store.js';

class FuseBox extends SignalWatcher(LitElement) {
  connectedCallback() {
    super.connectedCallback();
    this.timer = setInterval(() => {
      // Usamos el método oficial del Store
      store.registerVehicle();
    }, 1000);
  }

  render() {
    return html\`
      <div class="box">
        <h3>Panel de Control Principal</h3>
        <h2>Coches registrados: <span>\${store.cars.get()}</span></h2>
      </div>
    \`;
  }
}
customElements.define('fuse-box', FuseBox);

class RookieComponent extends LitElement {
  breakCity() {
    try {
      // 🚨 Intento fallido de hackeo:
      // Property '#cars' is not accessible.
      // store.cars es un Computed, NO TIENE .set()!
      store.cars.set(-9999);
    } catch (e) {
      console.error("Hackeo prevenido por el Store!", e.message);
      alert("⚠️ Error: " + e.message);
    }
  }

  render() {
    return html\`
      <div style="margin-top: 2rem; text-align: center;">
        <p>Módulo de Control Externo</p>
        <button @click=\${this.breakCity}>Intentar hackear el Store</button>
      </div>
      <div class="logs">El state original está protegido. Solo exponemos espejos seguros.</div>
    \`;
  }
}
customElements.define('rookie-component', RookieComponent);
`,
						"index.html": `<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="./index.js"></script>
    <style>
      body { font-family: system-ui; background: #222; color: white; padding: 2rem; margin: 0; }
      .box { border: 2px solid #0f766e; padding: 2rem; border-radius: 10px; text-align: center; }
      button { background: #0f766e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem; }
      button:active { transform: scale(0.95); }
      .logs { margin-top: 1rem; color: #34d399; font-family: monospace; max-width: 400px; text-align: center; }
    </style>
  </head>
  <body>
    <fuse-box></fuse-box>
    <rookie-component></rookie-component>
  </body>
</html>`
					}
				}
			]
		},
		scale: 30,
		stats: { maintainability: 50, portability: 10, performance: 10 },
		backgroundStyle: `url('/assets/the-fuse-box/background.png')`,
		startPos: { x: 50, y: 100 },
		exitZone: { x: 95, y: 70, width: 40, height: 30, label: msg("Next") },
		npc: {
			name: msg("The Cyber Guardian"),
			image: "/assets/the-fuse-box/npc.png",
			position: { x: 70, y: 65 },
		},
		reward: {
			scale: 12,
			name: msg("The Encrypted Master Key"),
			image: "/assets/the-fuse-box/reward.png",
			position: { x: 50, y: 50 },
		},
		hero: {
			image: "/assets/the-fuse-box/hero.png",
		},
	},
});
