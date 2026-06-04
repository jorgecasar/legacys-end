import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import "playground-elements/playground-ide.js";
import { codePlaygroundStyles } from "./CodePlayground.styles.js";

/**
 * @element code-playground
 *
 * Wrapper for playground-elements IDE.
 */
@customElement("code-playground")
export class CodePlayground extends LitElement {
	/**
	 * Record of files where key is filename and value is the content.
	 * @type {Record<string, string>}
	 * @public
	 */
	@property({ type: Object })
	accessor files = {};

	/** @type {import('playground-elements/playground-ide.js').PlaygroundIde | null} */
	@query("playground-ide")
	accessor _ide;

	/** @override */
	static styles = codePlaygroundStyles;

	/** @override */
	render() {
		const config = {
			files: Object.entries(this.files || {}).reduce((acc, [name, content]) => {
				acc[name] = { content };
				return acc;
			}, {}),
		};

		return html`
			<playground-ide 
				line-numbers 
				sandbox-base-url="/" 
				.config=${config}
				@keydown="${(/** @type {KeyboardEvent} */ e) => e.stopPropagation()}"
			></playground-ide>
		`;
	}
}
