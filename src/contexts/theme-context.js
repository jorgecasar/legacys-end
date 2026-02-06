import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").IThemeService} IThemeService
 */

/**
 * @type {import("@lit/context").Context<symbol, IThemeService>}
 */
export const themeContext = createContext(Symbol("theme-service"));
