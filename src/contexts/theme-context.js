import { createContext } from "@lit/context";

/**
 * @type {import("@lit/context").Context<unknown, import("../services/theme-service.js").ThemeService>}
 */
export const themeContext = createContext(Symbol("theme-service"));
