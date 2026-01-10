import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const questHubStyles = [
	...sharedStyles,
	css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			overflow-y: auto;
			background-color: var(--wa-color-surface-default);
			color: var(--wa-color-text-normal);
			--wa-font-sans: 'Press Start 2P', monospace;
		}

		.hub-container {
			max-width: 1400px;
			margin: 0 auto;
			padding: var(--wa-space-xl);
		}

		.hub-header {
			text-align: center;
			margin-bottom: var(--wa-space-xl);
		}

		.hub-title {
			font-size: var(--wa-font-size-3xl);
			margin: 0 0 var(--wa-space-xs) 0;
			font-family: var(--wa-font-family-heading);
			text-shadow: var(--wa-shadow-small);
			color: var(--wa-color-warning-fill-loud);
		}

		.hub-subtitle {
			font-size: var(--wa-font-size-l);
			margin: 0;
			opacity: 0.9;
		}

		.top-actions {
			position: absolute;
			top: var(--wa-space-m);
			right: var(--wa-space-m);
			z-index: 10;
			display: flex;
			gap: var(--wa-space-s);
		}

		.quests-section {
			margin-bottom: var(--wa-space-4xl);
		}

		.coming-soon-section {
			opacity: 0.7;
		}

		.hub-description {
			margin: 1.5rem auto 0 auto;
			font-size: var(--wa-font-size-s);
			line-height: 1.6;
			color: var(--wa-color-text-quiet);
			text-align: left;
		}

		.hub-footer {
			margin-top: var(--wa-space-4xl);
			text-align: center;
		}
	`,
];
