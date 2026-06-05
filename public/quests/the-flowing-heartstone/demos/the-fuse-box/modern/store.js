import { Signal } from "signal-polyfill";

export class TrafficStore {
	// 🛡️ El estado real se encapsula privadamente (#)
	#cars = new Signal.State(0);

	constructor() {
		// 🛡️ Se expone un espejo seguro (Computed) de solo lectura
		this.cars = new Signal.Computed(() => this.#cars.get());
	}

	// The only authorized method to mutate state
	registerVehicle() {
		this.#cars.set(this.#cars.get() + 1);
	}
}

export const store = new TrafficStore();
