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

		.quest-card.locked {
			cursor: not-allowed;
			opacity: 0.6;
		}

		/* Variants */
		.quest-card.variant-brand {
			--wa-card-border-color: var(--wa-color-brand-600);
			--wa-card-border-top-width: 4px;
		}
		
		.quest-card.variant-success {
			--wa-card-border-color: #10b981;
			--wa-card-border-top-width: 4px;
		}
		
		.quest-card.variant-neutral {
			--wa-card-border-color: #6b7280;
		}

		.quest-card.completed {
			--wa-card-border-color: #10b981;
		}

		.quest-content {
			display: flex;
			flex-direction: column;
			flex: 1;
			gap: var(--wa-space-s);
		}

		.quest-description {
			flex: 1;
		}

		.quest-subtitle {
			font-style: italic;
			color: var(--wa-color-text-quiet);
			margin: 0;
		}

		.quest-meta {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: var(--wa-font-size-2xs);
		}

		.quest-time {
			opacity: 0.8;
			display: flex;
			align-items: center;
			gap: var(--wa-space-2xs);
		}


		.prerequisites {
			font-size: var(--wa-font-size-2xs);
			opacity: 0.8;
			margin: 0;
			color: var(--wa-color-neutral-40);
			text-align: center;
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
