import { createContext } from "@lit/context";

/** @typedef {import('../services/interfaces.js').ILoggerService} ILoggerService */

/** @type {import('@lit/context').Context<symbol, ILoggerService>} */
export const loggerContext = createContext(Symbol("logger"));
