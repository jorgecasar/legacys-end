import { createContext } from "@lit/context";

/**
 * @typedef {import('../types/services.d.js').IStorageAdapter} IStorageAdapter
 */

/** @type {import('@lit/context').Context<unknown, IStorageAdapter>} */
export const storageContext = createContext("storage");
