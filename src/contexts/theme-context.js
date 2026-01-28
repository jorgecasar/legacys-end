import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").IThemeService} IThemeService
 */

/**
 * @type {import("@lit/context").Context<symbol, IThemeService>}
 */
export const themeContext = createContext(Symbol("theme-service"));
