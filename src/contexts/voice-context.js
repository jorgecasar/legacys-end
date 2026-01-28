import { createContext } from "@lit/context";

/**
 * @typedef {import("../services/interfaces.js").IVoiceSynthesisService} IVoiceSynthesisService
 */

/**
 * @type {import("@lit/context").Context<symbol, IVoiceSynthesisService>}
 */
export const voiceContext = createContext(Symbol("voice-service"));
