import { css } from "lit";
import { sharedStyles } from "../../../styles/shared.js";

export const gameThemeZonesStyles = [
	...sharedStyles,
	css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			position: absolute;
			top: 0;
			left: 0;
			pointer-events: none;
			z-index: 10;
		}

		.zone {
			position: absolute;
			width: 50%;
			height: 100%;
			top: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0.1;
		}

		.zone-light {
			left: 0;
			background-color: var(--wa-color-neutral-0);
		}

		.zone-dark {
			right: 0;
			background-color: var(--wa-color-neutral-900);
		}

		.zone-label {
			font-family: 'Press Start 2P', monospace;
			font-size: var(--wa-font-size-2xl);
			z-index: 20;
		}

		.zone-light .zone-label {
			color: var(--wa-color-neutral-900);
		}

		.zone-dark .zone-label {
			color: var(--wa-color-neutral-0);
		}
	`,
];
