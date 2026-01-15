import { ContextProvider } from "@lit/context";

import { characterContext } from "../contexts/character-context.js";
import { profileContext } from "../contexts/profile-context.js";

/**
 * @typedef {Object} ContextMixinInterface
 * @property {ContextProvider<any>} profileProvider - Provider for profile context
 * @property {ContextProvider<any>} characterProvider - Provider for character context
 */

/**
 * ContextMixin - Validates and initializes all application context providers
 * @template {new (...args: any[]) => HTMLElement} T
 * @param {T} superClass
 * @returns {T & (new (...args: any[]) => ContextMixinInterface)}
 */
export const ContextMixin = (superClass) =>
	/** @mixes ContextMixinInterface */
	class extends superClass {
		/** @param {any[]} args */
		constructor(...args) {
			super(...args);
			this.profileProvider = new ContextProvider(this, {
				context: profileContext,
				initialValue: { loading: true },
			});
			// themeProvider refactored to LegacysEndApp as a direct Service Provider
			this.characterProvider = new ContextProvider(this, {
				context: characterContext,
				initialValue: {
					suit: {},
					gear: {},
					power: {},
					mastery: {},
				},
			});
		}
	};
