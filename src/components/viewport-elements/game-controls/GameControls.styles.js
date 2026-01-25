import { css } from "lit";
import { touchStyles } from "../../../controllers/touch-controller.js";
import { sharedStyles } from "../../../styles/shared.js";

export const gameControlsStyles = [
	sharedStyles,
	touchStyles,
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

		.instructions-wrapper {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: var(--wa-space-3xs);
		}

		.mode-toggle {
			opacity: 0.7;
			transition: opacity 0.3s ease;
		}

		.mode-toggle:hover {
			opacity: 1;
		}

		/* Styling buttons inside group for a cleaner look */
		.mode-toggle wa-button::part(base) {
			border-radius: 0;
		}

		.controls-details {
			background-color: var(--wa-color-surface-default);
			border-radius: 0;
			box-shadow: var(--wa-shadow-medium);
			max-width: 200px;
		}

		.controls-details::part(content) {
			padding: var(--wa-space-s) var(--wa-space-m);
		}

		.controls-details::part(summary) {
			font-weight: bold;
			font-size: var(--wa-font-size-xs);
			padding: var(--wa-space-s) var(--wa-space-m);
			text-transform: uppercase;
		}

		.details-content {
			display: flex;
			flex-direction: column;
			gap: var(--wa-space-s);
		}

		.mode-toggle {
			align-self: center;
			opacity: 0.8;
			transition: opacity 0.3s ease;
		}

		/* Force content to expand upwards */
		.controls-details[open] {
			display: flex;
			flex-direction: column-reverse;
		}

		.controls-details p {
			margin: 0;
			font-size: var(--wa-font-size-xs);
		}

		@media (max-width: 600px) {
			:host {
				position: static;
				width: 100%;
				padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
			}

			.controls-container {
				flex-direction: column-reverse;
				align-items: center;
				gap: 1rem;
			}

			.instructions-wrapper {
				width: 100%;
				align-items: center;
				gap: 0.5rem;
			}

			.controls-details {
				width: 100%;
				max-width: 400px;
			}
		}

		@keyframes pulse {
			0% { opacity: 1; }
			50% { opacity: 0.5; }
			100% { opacity: 1; }
		}
	`,
];
