import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").ILocalizationService} ILocalizationService
 */

/**
 * @type {import("@lit/context").Context<symbol, ILocalizationService>}
 */
export const localizationContext = createContext(
	Symbol("localization-service"),
);
