import { createContext } from "@lit/context";

/**
 * @typedef {import("../types/services.d.js").IVoiceSynthesisService} IVoiceSynthesisService
 */

/**
 * @type {import("@lit/context").Context<symbol, IVoiceSynthesisService>}
 */
export const voiceContext = createContext(Symbol("voice-service"));
