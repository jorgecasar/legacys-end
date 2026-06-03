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
			"I'm isolating this pressure sensor. It was so coupled to the general state that, every time you stepped on it, you forced me to render the entire intersection! Look, I'll show you how to fix it.",
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
			"The sensor's state was tied to the root of the UI tree through a global context. As a result, every interaction forced the framework to unnecessarily re-evaluate and re-render the entire intersection.",
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
					title: msg("Legacy React (Context)"),
					code: `// 1. Estado en la raíz porque dos hermanos necesitan compartirlo
function CityApp() {
  const [pedestrians, setPedestrians] = useState(false);

  // 2. Al cambiar, CityApp y TODOS sus hijos sufren re-render
  return (
    <CityContext.Provider value={{ pedestrians, setPedestrians }}>
      <TrafficLight />
      <PedestrianSensor />
    </CityContext.Provider>
  );
}

// 3. El semáforo de coches se ve obligado a leer el contexto superior
function TrafficLight() {
  const { pedestrians } = useContext(CityContext);
  return <div className="light">{pedestrians ? '🔴' : '🟢'}</div>;
}

// 4. El sensor manda la orden hacia arriba al detectar presencia
function PedestrianSensor() {
  const { setPedestrians } = useContext(CityContext);
  return (
    <div className="crosswalk-zone"
      onMouseEnter={() => setPedestrians(true)}
      onMouseLeave={() => setPedestrians(false)}>
      Zona de espera
    </div>
  );
}`,
				},
				{
					title: msg("Legacy Lit (Events & Props)"),
					code: `// 1. El componente raíz guarda el estado para compartirlo
@customElement('city-app')
class CityApp extends LitElement {
  @state() pedestrians = false;

  // 2. Re-evalúa el template entero para pasar la prop hacia abajo
  render() {
    return html\`
      <traffic-light .isRed=\${this.pedestrians}></traffic-light>
      <pedestrian-sensor @presence=\${(e) => this.pedestrians = e.detail}></pedestrian-sensor>
    \`;
  }
}

// 3. El semáforo espera dócilmente a que su padre le pase la prop
@customElement('traffic-light')
class TrafficLight extends LitElement {
  @property() isRed = false;
  render() { return html\`<div class="light">\${this.isRed ? '🔴' : '🟢'}</div>\`; }
}

// 4. El sensor manda la petición hacia arriba mediante eventos
@customElement('pedestrian-sensor')
class PedestrianSensor extends LitElement {
  render() {
    return html\`
      <div class="crosswalk-zone"
        @mouseenter=\${() => this.dispatchEvent(new CustomEvent('presence', {detail: true, bubbles: true, composed: true}))}
        @mouseleave=\${() => this.dispatchEvent(new CustomEvent('presence', {detail: false, bubbles: true, composed: true}))}>
        Zona de espera
      </div>
    \`;
  }
}`,
				},
			],
			end: [
				{
					title: msg("Modern React (TC39 Signals)"),
					code: `import { Signal } from "signal-polyfill";

// 1. El estado vive de forma autónoma y global
export const pedestriansWaiting = new Signal.State(false);

function CityApp() {
  // 2. CityApp ya NO tiene estado. NUNCA sufre re-render.
  return (
    <>
      <TrafficLight />
      <PedestrianSensor />
    </>
  );
}

// 3. El semáforo se suscribe directamente a la señal
function TrafficLight() {
  const waiting = useSignal(pedestriansWaiting);
  return <div className="light">{waiting ? '🔴' : '🟢'}</div>;
}

// 4. El sensor muta la señal directamente, sin avisar a nadie más
function PedestrianSensor() {
  return (
    <div className="crosswalk-zone"
      onMouseEnter={() => pedestriansWaiting.set(true)}
      onMouseLeave={() => pedestriansWaiting.set(false)}>
      Zona de espera
    </div>
  );
}`,
				},
				{
					title: msg("Modern Lit (TC39 Signals)"),
					code: `import { Signal } from "@lit-labs/signals";

// 1. El estado vive de forma autónoma y global
export const pedestriansWaiting = new Signal.State(false);

@customElement('city-app')
class CityApp extends LitElement {
  // 2. CityApp ya NO tiene estado. NUNCA sufre re-render.
  render() {
    return html\`
      <traffic-light></traffic-light>
      <pedestrian-sensor></pedestrian-sensor>
    \`;
  }
}

// 3. El semáforo reacciona independientemente a la señal
@customElement('traffic-light')
class TrafficLight extends SignalWatcher(LitElement) {
  render() {
    return html\`<div class="light">\${pedestriansWaiting.get() ? '🔴' : '🟢'}</div>\`;
  }
}

// 4. El sensor muta la señal de forma local
@customElement('pedestrian-sensor')
class PedestrianSensor extends LitElement {
  render() {
    return html\`
      <div class="crosswalk-zone"
        @mouseenter=\${() => pedestriansWaiting.set(true)}
        @mouseleave=\${() => pedestriansWaiting.set(false)}>
        Zona de espera
      </div>
    \`;
  }
}`,
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
						"I have a detector on the crosswalk, and every time you step on it you force me to rebuild the entire intersection. Step out of the crosswalk so the traffic light turns green and we can talk calmly!",
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
			"What a disaster! The system calculates the traffic level incessantly even when nobody is paying attention. I'll show you how to build a lazy intermediate module that sleeps until someone explicitly asks for the data.",
		),
		problemTitle: msg("Before: Eager Computation"),
		problemDesc: msg(
			"The legacy system calculated derived values eagerly on every lifecycle tick, wasting CPU cycles even if no monitors were active.",
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
					title: msg("Legacy React (Eager)"),
					code: `function TrafficMonitor() {
  const [isJam, setIsJam] = useState(false);

  useEffect(() => {
    // Desperdicia CPU evaluando lógica constantemente aunque nada cambie
    const timer = setInterval(() => {
      setIsJam(calculateHeavyTrafficRules(globalCars));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>{isJam ? 'JAM' : 'OK'}</div>;
}`,
				},
				{
					title: msg("Legacy Lit (Eager)"),
					code: `@customElement('traffic-monitor')
class TrafficMonitor extends LitElement {
  @state() isJam = false;

  connectedCallback() {
    super.connectedCallback();
    // Desperdicia CPU evaluando lógica constantemente aunque nada cambie
    this.timer = setInterval(() => {
      this.isJam = calculateHeavyTrafficRules(globalCars);
    }, 1000);
  }

  render() {
    return html\`<div>\${this.isJam ? 'JAM' : 'OK'}</div>\`;
  }
}`,
				},
			],
			end: [
				{
					title: msg("Modern React (Lazy Computed)"),
					code: `// Computed evalúa de forma perezosa (Lazy) solo si alguien lee su valor
const isTrafficJam = new Signal.Computed(() => {
  return calculateHeavyTrafficRules(carCount.get());
});

function TrafficMonitor() {
  // Si el componente no está montado, la lógica de isTrafficJam NUNCA se ejecuta. Coste CERO.
  const jam = useSignal(isTrafficJam);
  return <div>{jam ? 'JAM' : 'OK'}</div>;
}`,
				},
				{
					title: msg("Modern Lit (Lazy Computed)"),
					code: `import { SignalWatcher } from "@lit-labs/signals";

// Computed evalúa de forma perezosa (Lazy) solo si alguien lee su valor
const isTrafficJam = new Signal.Computed(() => {
  return calculateHeavyTrafficRules(carCount.get());
});

@customElement('traffic-monitor')
class TrafficMonitor extends SignalWatcher(LitElement) {
  render() {
    // Si el componente no está en el DOM, la lógica de isTrafficJam NUNCA se ejecuta. Coste CERO.
    return html\`<div>\${isTrafficJam.get() ? 'JAM' : 'OK'}</div>\`;
  }
}`,
				},
			],
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
			"Why yell to the whole city just to change one bulb? I'm threading a direct fiber optic cable to that traffic light. Let me teach you how to bypass the framework's massive diffing.",
		),
		problemTitle: msg("Before: VDOM Diffing"),
		problemDesc: msg(
			"The legacy framework performed massive 'diffing' by comparing hundreds of virtual nodes just to realize it only needed to update the text of a single <span>.",
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
					title: msg("Legacy React (VDOM)"),
					code: `function TrafficLight({ isJam }) {
  // El framework debe hacer diffing de todo el árbol VDOM para cambiar 1 texto
  return (
    <div className="city-intersection">
      {/* ...cientos de nodos intermedios evaluados inútilmente... */}
      <span className="light">{isJam ? '🔴' : '🟢'}</span>
    </div>
  );
}`,
				},
				{
					title: msg("Legacy Lit (Template Diffing)"),
					code: `@customElement('traffic-light')
class TrafficLight extends LitElement {
  @property() isJam = false;

  render() {
    // El framework reevalúa todo el template para cambiar 1 texto
    return html\`
      <div class="city-intersection">
        <!-- ...cientos de nodos intermedios evaluados inútilmente... -->
        <span class="light">\${this.isJam ? '🔴' : '🟢'}</span>
      </div>
    \`;
  }
}`,
				},
			],
			end: [
				{
					title: msg("Modern React (Direct Ref Mutation)"),
					code: `function TrafficLight() {
  const lightRef = useRef(null);

  useEffect(() => {
    // Nos saltamos la fase de render() totalmente. Actualización O(1).
    return effect(() => {
      lightRef.current.textContent = isTrafficJam.get() ? '🔴' : '🟢';
    });
  }, []);

  return (
    <div className="city-intersection">
      {/* Cientos de nodos intactos que NUNCA sufren re-render */}
      <span className="light" ref={lightRef}></span>
    </div>
  );
}`,
				},
				{
					title: msg("Modern Lit (Watch Directive)"),
					code: `import { watch } from "@lit-labs/signals";

@customElement('traffic-light')
class TrafficLight extends LitElement {
  render() {
    // watch() conecta el Signal directamente a ese text node en concreto.
    // Nos saltamos el ciclo de render() de Lit. Actualización O(1).
    return html\`
      <div class="city-intersection">
        <!-- Cientos de nodos intactos que NUNCA sufren re-evaluación -->
        <span class="light">\${watch(isTrafficJam)}</span>
      </div>
    \`;
  }
}`,
				},
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
			"Two simultaneous events are tearing our UI apart! We've got an ambulance and heavy traffic. I'm stabilizing the grid so the state updates atomically. Watch closely!",
		),
		problemTitle: msg("Before: Glitchy Renders (Tearing)"),
		problemDesc: msg(
			"Updating variables separately triggered the framework twice in a chaotic order, generating visual 'tearing' (an invalid intermediate state on screen).",
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
					title: msg("Legacy React (Tearing)"),
					code: `function Dispatcher() {
  // Mutaciones separadas fuera de un batch (ej. en un setTimeout o evento)
  const onEmergency = () => {
    setAmbulanceNear(true); // -> Dispara Render 1 (La UI ve ambulancia sin tráfico)
    setHeavyTraffic(true);  // -> Dispara Render 2 (La UI por fin ve la emergencia completa)
    // El usuario percibe un "glitch" visual intermedio donde el estado es inválido.
  };
}`,
				},
				{
					title: msg("Legacy Lit (Tearing)"),
					code: `@customElement('city-dispatcher')
class Dispatcher extends LitElement {
  onEmergency() {
    // Mutar propiedades de Lit de forma consecutiva
    this.ambulanceNear = true;
    // ...si otro componente lee el DOM en este preciso instante, verá un estado inconsistente...
    this.heavyTraffic = true;
  }
}`,
				},
			],
			end: [
				{
					title: msg("Modern React (Atomic Graph)"),
					code: `const emergency = new Signal.Computed(() =>
  ambulanceNear.get() && heavyTraffic.get()
);

function Dispatcher() {
  const onEmergency = () => {
    ambulanceNear.set(true);
    heavyTraffic.set(true);
    // El algoritmo Push/Pull estabiliza el grafo antes de que React despierte.
    // React solo procesa y renderiza el estado final (emergency = true). Cero glitches.
  };
}`,
				},
				{
					title: msg("Modern Lit (Atomic Graph)"),
					code: `const emergency = new Signal.Computed(() =>
  ambulanceNear.get() && heavyTraffic.get()
);

@customElement('city-dispatcher')
class Dispatcher extends LitElement {
  onEmergency() {
    ambulanceNear.set(true);
    heavyTraffic.set(true);
    // El algoritmo Push/Pull estabiliza el grafo de forma atómica.
    // Lit solo reacciona cuando los cambios están completamente estabilizados.
  }
}`,
				},
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
			"Security breach! The traffic network is wide open. Any rookie component can mutate the raw data anywhere. Let's lock this fuse box and expose only safe, read-only mirrors.",
		),
		problemTitle: msg("Before: Global Mutable State"),
		problemDesc: msg(
			"A completely public and mutable global state. Any component could overwrite the source of truth, causing impossible-to-track bugs.",
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
					title: msg("Legacy React (Global Mutable State)"),
					code: `// store.js
export const cityState = { cars: 0, isTrafficJam: false };

// Cualquier componente novato podía mutar y destruir la fuente de verdad
function RookieComponent() {
  const breakCity = () => {
    cityState.cars = -999; // Mutación directa impredecible
  };
}`,
				},
				{
					title: msg("Legacy Lit (Global Mutable State)"),
					code: `// store.js
export const cityState = { cars: 0, isTrafficJam: false };

// Cualquier componente novato podía mutar y destruir la fuente de verdad
@customElement('rookie-component')
class Rookie extends LitElement {
  breakCity() {
    cityState.cars = -999; // Mutación directa impredecible
  }
}`,
				},
			],
			end: [
				{
					title: msg("Modern React (Store Governance)"),
					code: `// store.js
export class TrafficStore {
  // El estado real se encapsula privadamente (#)
  #cars = new Signal.State(0);

  constructor() {
    // Se expone un espejo seguro (Computed) para consumo público de React
    this.cars = new Signal.Computed(() => this.#cars.get());
  }

  registerVehicle() {
    this.#cars.set(this.#cars.get() + 1);
  }
}

function RookieComponent({ store }) {
  const breakCity = () => {
    // Error: Property '#cars' is not accessible.
    // store.cars es un Computed de solo lectura (no tiene método .set())
    store.cars = -999;
  };
}`,
				},
				{
					title: msg("Modern Lit (Store Governance)"),
					code: `// store.js
export class TrafficStore {
  // El estado real se encapsula privadamente (#)
  #cars = new Signal.State(0);

  constructor() {
    // Se expone un espejo seguro (Computed) para consumo público de Lit
    this.cars = new Signal.Computed(() => this.#cars.get());
  }

  registerVehicle() {
    this.#cars.set(this.#cars.get() + 1);
  }
}

@customElement('rookie-component')
class Rookie extends LitElement {
  @consume({context: storeContext}) store;

  breakCity() {
    // Error: Property '#cars' is not accessible.
    // this.store.cars es un Computed de solo lectura (no tiene método .set())
    this.store.cars = -999;
  }
}`,
				},
			],
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
		hero: { image: "/assets/the-fuse-box/hero.png" },
	},
});
