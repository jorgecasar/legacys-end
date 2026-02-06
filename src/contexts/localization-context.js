import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").ILocalizationService} ILocalizationService
 */

/**
 * @type {import("@lit/context").Context<symbol, ILocalizationService>}
 */
export const localizationContext = createContext(
	Symbol("localization-service"),
);
