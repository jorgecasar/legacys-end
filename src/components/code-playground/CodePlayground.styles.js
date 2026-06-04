import { css } from "lit";

export const codePlaygroundStyles = css`
	:host {
		display: block;
		position: relative;
		width: 100%;
		height: 100%;
		flex: 1;
		min-height: 0;
		border-radius: var(--radius-md, 8px);
		overflow: hidden;
		background: var(--surface-2, #1e1e1e);
		border: 1px solid var(--border-color, #333);
	}

	playground-ide {
		height: 100%;
		
		/* General Layout & Fonts */
		--playground-border: transparent;
		--playground-code-background: #18181b; /* Zinc 900 */
		--playground-preview-background: #09090b; /* Zinc 950 */
		--playground-font-family: var(--wa-font-family-code, monospace);
		--playground-font-size: var(--wa-font-size-s, 14px);
		--playground-highlight-color: var(--wa-color-brand-fill-loud, #0f766e);

		/* Tab Bar Customization */
		--playground-tab-bar-background: #27272a; /* Zinc 800 */
		--playground-tab-bar-foreground-color: #a1a1aa; /* Zinc 400 */
		--playground-tab-bar-active-color: #ffffff; /* White */
		--playground-tab-bar-active-background: #18181b; /* Zinc 900 */

		/* Premium Dark Syntax Highlighting */
		--playground-code-default-color: #e4e4e7; /* Zinc 200 (Default code color) */
		--playground-code-keyword-color: #f472b6; /* Pink 400 (import, class, render, return) */
		--playground-code-number-color: #fb923c; /* Orange 400 (numbers) */
		--playground-code-string-color: #34d399; /* Emerald 400 (strings, template literals) */
		--playground-code-comment-color: #71717a; /* Zinc 500 (comments) */
		--playground-code-type-color: #60a5fa; /* Blue 400 (types, CustomEvent) */
		--playground-code-builtin-color: #fb7185; /* Rose 400 (builtins) */
		--playground-code-atom-color: #a78bfa; /* Violet 400 (booleans, null) */
		--playground-code-def-color: #38bdf8; /* Sky 400 (functions/methods and classes name) */
		--playground-code-tag-color: #f43f5e; /* Rose 500 (HTML tag names inside templates) */
		--playground-code-attribute-color: #fb923c; /* Orange 400 (HTML attributes like class, src) */
		--playground-code-callee-color: #60a5fa; /* Blue 400 (called functions) */
		--playground-code-property-color: #e4e4e7; /* Zinc 200 */
		--playground-code-variable-color: #e4e4e7; /* Zinc 200 */
		--playground-code-operator-color: #a1a1aa; /* Zinc 400 (operators) */
		--playground-code-meta-color: #f472b6; /* Pink 400 */
	}

	/* Style tab buttons to ensure good contrast inside the Shadow DOM */
	playground-ide::part(tab) {
		color: #a1a1aa !important;
		font-weight: 500;
		transition: color 0.2s, background-color 0.2s;
	}

	playground-ide::part(tab):hover {
		color: #ffffff !important;
		background-color: #202023 !important;
	}

	playground-ide::part(active-tab) {
		color: #ffffff !important;
		background-color: #18181b !important;
		box-shadow: inset 0 -2px 0 var(--wa-color-brand-fill-loud, #0f766e);
	}
`;
