import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import "playground-elements/playground-project.js";
import "playground-elements/playground-tab-bar.js";
import "playground-elements/playground-file-editor.js";
import "playground-elements/playground-preview.js";
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

	/**
	 * Path to the project manifest file for playground-elements IDE.
	 * @type {string}
	 * @public
	 */
	@property({ type: String })
	accessor projectSrc = "";

	/** @type {import('playground-elements/playground-project.js').PlaygroundProject | null} */
	@query("playground-project")
	accessor _project = null;

	/** @override */
	static styles = codePlaygroundStyles;

	/** @override */
	render() {
		const hasFiles = Object.keys(this.files || {}).length > 0;
		const config = hasFiles
			? {
					files: Object.entries(this.files || {}).reduce(
						(
							/** @type {Record<string, {content: string}>} */ acc,
							[name, content],
						) => {
							acc[name] = { content };
							return acc;
						},
						{},
					),
				}
			: undefined;

		return html`
			<playground-project 
				id="project"
				.sandboxBaseUrl=${import.meta.env.BASE_URL} 
				.projectSrc=${ifDefined(this.projectSrc || undefined)}
				.config=${ifDefined(config)}
			></playground-project>

			<div class="layout" @keydown="${(/** @type {KeyboardEvent} */ e) => e.stopPropagation()}">
				<div class="editor-pane">
					<playground-tab-bar .project=${"project"} .editor=${"editor"}></playground-tab-bar>
					<playground-file-editor id="editor" .project=${"project"} line-numbers></playground-file-editor>
				</div>
				<div class="preview-pane">
					<playground-preview .project=${"project"}></playground-preview>
				</div>
			</div>
		`;
	}
}
