import { css } from "lit";
import { sharedStyles } from "../../../styles/shared.js";

export const gameControlsStyles = [
	sharedStyles,
	css`
		:host {
			position: absolute;
			bottom: 1rem;
			right: 1rem;
			z-index: 50;
		}

		.controls-container {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: var(--wa-space-2xs);
		}

		.voice-toggle {
			transition: all 0.3s ease;
			opacity: 0.7;
		}

		.voice-toggle:hover {
			opacity: 1;
		}

		.voice-toggle.active {
			opacity: 1;
			--wa-button-text-color: var(--wa-color-danger-fill-loud);
			font-weight: bold;
		}

		.voice-toggle.active wa-icon {
			animation: pulse 2s infinite;
		}

		.controls-details {
			--spacing: var(--wa-space-xs);
		}

		.controls-details::part(summary) {
			font-size: var(--wa-font-size-xs);
		}

		.controls-details p {
			margin: 0;
			font-size: var(--wa-font-size-xs);
		}

		@keyframes pulse {
			0% { opacity: 1; }
			50% { opacity: 0.5; }
			100% { opacity: 1; }
		}
	`,
];
