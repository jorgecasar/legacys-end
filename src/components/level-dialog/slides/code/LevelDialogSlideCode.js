import { msg } from "@lit/localize";
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "syntax-highlight-element";
import { escapeHtml } from "../../../../utils/html-utils.js";
import { levelDialogStyles } from "../../LevelDialog.styles.js";

/** @typedef {import('../../../../content/quests/quest-types.js').LevelConfig} LevelConfig */
/** @typedef {import('../../../../content/quests/quest-types.js').CodeSnippet} CodeSnippet */

/**
 * @element level-dialog-slide-code
 */
export class LevelDialogSlideCode extends SignalWatcher(LitElement) {
	/** @type {CodeSnippet[]} */
	@property({ type: Array })
	accessor snippets = [];

	/** @type {'start' | 'end'} */
	@property({ type: String })
	accessor type = "start";

	/** @override */
	static styles = levelDialogStyles;

	/**
	 * @param {LevelConfig} config
	 * @param {string} type
	 * @returns {string}
	 */
	static getAccessibilityText(config, type) {
		const snippets =
			type === "start"
				? config?.codeSnippets?.start
				: config?.codeSnippets?.end;
		return snippets?.map((s) => `${s.title}.`).join(" ") || "";
	}

	/**
	 * @param {CodeSnippet} snippet
	 */
	#renderCode({ title = msg("Identified Problem"), code, language = "js" }) {
		return html`
			<h6 class="slide-title code-${this.type}">${title}</h6>
			<!-- @ts-ignore -->
			<syntax-highlight language="${language}" class="code-${this.type}" .innerHTML=${escapeHtml(code)}></syntax-highlight>
		`;
	}

	/** @override */
	render() {
		return html`
			${this.snippets?.map((snippet) => this.#renderCode(snippet))}
		`;
	}
}
