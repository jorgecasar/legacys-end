import { createContext } from "@lit/context";

/** @typedef {import("../services/preloader-service.js").PreloaderService} PreloaderService */

/** @type {import('@lit/context').Context<symbol, PreloaderService>} */
export const preloaderContext = createContext(Symbol("preloader"));
