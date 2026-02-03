import { ContextProvider } from "@lit/context";
import { html, LitElement } from "lit";

export class ContextProviderElement extends LitElement {
	/** @override */
	static properties = {
		context: { type: Object },
		value: { type: Object },
	};

	constructor() {
		super();
		/** @type {any} */
		this.context = null;
		/** @type {any} */
		this.value = null;
		/** @type {ContextProvider<any> | null} */
		this._provider = null;
	}

	/** @override */
	connectedCallback() {
		super.connectedCallback();
		this._initializeProvider();
	}

	_initializeProvider() {
		if (this.context && !this._provider) {
			this._provider = new ContextProvider(this, {
				context: this.context,
				initialValue: this.value,
			});
			// Force request update if provider was created after connection
			this.requestUpdate();
		}
	}

	/**
	 * @param {import('lit').PropertyValues} changedProperties
	 * @override
	 */
	updated(changedProperties) {
		super.updated(changedProperties);
		if (changedProperties.has("context")) {
			this._initializeProvider();
		}
		if (changedProperties.has("value") && this._provider) {
			this._provider.setValue(this.value);
		}
	}

	/** @override */
	render() {
		return html`<slot></slot>`;
	}
}

if (!customElements.get("context-provider")) {
	customElements.define("context-provider", ContextProviderElement);
}
