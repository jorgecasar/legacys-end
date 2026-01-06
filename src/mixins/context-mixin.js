import { ContextProvider } from "@lit/context";
export { ContextProvider };

import { characterContext } from "../contexts/character-context.js";
import { profileContext } from "../contexts/profile-context.js";
import { themeContext } from "../contexts/theme-context.js";

/**
 * @typedef {Object} ContextMixinInterface
 * @property {ContextProvider<any>} profileProvider - Provider for profile context
 * @property {ContextProvider<any>} themeProvider - Provider for theme context
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
			this.themeProvider = new ContextProvider(this, {
				context: themeContext,
				initialValue: { themeMode: "light" },
			});
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
