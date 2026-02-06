import { createContext } from "@lit/context";

/** @typedef {import('../types/services.d.js').ILoggerService} ILoggerService */

/** @type {import('@lit/context').Context<symbol, ILoggerService>} */
export const loggerContext = createContext(Symbol("logger"));
