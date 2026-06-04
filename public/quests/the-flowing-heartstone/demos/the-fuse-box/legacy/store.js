import { Signal } from "signal-polyfill";

// Un estado global expuesto e inseguro usando Signals
export const cityState = {
	cars: new Signal.State(0),
};
