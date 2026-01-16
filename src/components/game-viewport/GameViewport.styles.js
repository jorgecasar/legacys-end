import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const gameViewportStyles = [
	...sharedStyles,
	css`
		.controls-details {
			position: absolute;
			bottom: var(--wa-space-m);
			right: var(--wa-space-m);
			z-index: 10;
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

		/* Force content to expand upwards */
		.controls-details[open] {
			display: flex;
			flex-direction: column-reverse;
		}

		.game-area {
			position: relative;
			/* Force square by using the smaller dimension */
			width: min(100%, calc(100vh - 96px)); /* 96px approximate HUD height */
			height: min(100%, calc(100vh - 96px));
			aspect-ratio: 1/1;
			/* Center the square */
			margin: 0 auto;
			transition: background 1s ease-in-out;
		}

		.game-area-bg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
			z-index: 0;
			pointer-events: none;
			transition: opacity 1s ease-in-out;
		}

		/* Zone Overlays */
		.zone {
			position: absolute;
			top: 0; bottom: 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			align-items: center;
			padding-bottom: 1rem;
		}
		.zone-light { top: 25%; width: 100%; height: 75%; background-color: rgba(255,255,255,0.1); border-right: 2px dashed rgba(255,255,255,0.2); }
		.zone-dark { top: 0%; width: 100%; height: 25%;  background-color: rgba(0,0,0,0.3); }
		.zone-label { color: rgba(255,255,255,0.5); font-weight: bold; text-transform: uppercase; }


		.exit-text {
			position: relative;
			white-space: nowrap;
			animation: bounce 1s infinite;
		}

		/* Hero Container */
		hero-profile {
			position: absolute; z-index: 30;
			transform: translate(-50%, -50%);
			will-change: transform, left, top;
			width: 15%;
			aspect-ratio: 1/1;
			pointer-events: none;
		}

		.locked-message {
			position: absolute;
			top: 20%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: var(--wa-color-surface-floating);
			color: var(--wa-color-text-default);
			padding: var(--wa-space-s) var(--wa-space-m);
			border-radius: var(--wa-border-radius-m);
			font-weight: bold;
			z-index: 100;
			pointer-events: none;
			text-align: center;
			box-shadow: var(--wa-shadow-large);
			border: 1px solid var(--wa-color-border-default);
			animation: slideDown 0.3s ease-out;
		}

		@keyframes slideDown {
			from { transform: translate(-50%, -100%); opacity: 0; }
			to { transform: translate(-50%, -50%); opacity: 1; }
		}

		reward-element {
			width: 5%;
			aspect-ratio: 1/1;
			z-index: 20;
			transition: all 0.8s ease-in-out;
		}

		reward-element.growing {
			transform: translate(-50%, -50%) scale(10);
			z-index: 100;
		}

		reward-element.moving {
			transform: translate(-50%, -50%) scale(0.1);
			opacity: 0;
		}

		@keyframes bounce {
			0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
			50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
		}
	`,
];
