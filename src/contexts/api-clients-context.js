import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/user-api-client.js").UserApiClients} UserApiClients
 */

/** @type {import('@lit/context').Context<"api-clients", UserApiClients>} */
export const apiClientsContext = createContext("api-clients");
