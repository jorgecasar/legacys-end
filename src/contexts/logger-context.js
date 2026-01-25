import { createContext } from "@lit/context";

/** @typedef {import('../services/interfaces.js').ILoggerService} ILoggerService */

/** @type {import('@lit/context').Context<any, ILoggerService>} */
export const loggerContext = createContext("logger");
