import { SignalWatcher } from "@lit-labs/signals";
import { css, html, LitElement, nothing } from "lit";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import { updateWhenLocaleChanges } from "@lit/localize";
import { allLocales } from "../../generated/locales/locale-codes.js";

/**
 * LanguageSelector
 * @property {import('../../services/localization-service.js').LocalizationService} localizationService
 */
export class LanguageSelector extends SignalWatcher(LitElement) {
	static properties = {
		localizationService: { attribute: false },
	};

	static styles = css`
		:host {
			display: block;
		}
		wa-select {
			width: 12ch;
		}
	`;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
		/** @type {import('../../services/localization-service.js').LocalizationService | null} */
		this.localizationService = null;
	}

	render() {
		if (!this.localizationService) return nothing;

		const currentLocale = this.localizationService.getLocale();

		return html`
			<wa-select
				.value="${currentLocale}"
				@change="${this.#handleParamsChange}"
			>
				${allLocales.map(
					(/** @type {string} */ locale) => html`
						<wa-option value="${locale}" ?selected="${locale === currentLocale}">
							${this.#getLocaleLabel(locale)}
						</wa-option>
					`,
				)}
			</wa-select>
		`;
	}

	/**
	 * @param {any} event
	 */
	#handleParamsChange(event) {
		const newLocale = event.target.value;
		if (this.localizationService) {
			this.localizationService.setLocale(newLocale);
		}
	}

	/**
	 * @param {string} locale
	 */
	#getLocaleLabel(locale) {
		/** @type {Record<string, string>} */
		const labels = {
			en: "English",
			es: "Español",
		};
		return labels[locale] || locale;
	}
}

customElements.define("language-selector", LanguageSelector);
