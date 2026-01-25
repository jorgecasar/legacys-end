import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const gameViewportStyles = [
	...sharedStyles,
	css`
		:host {
			position: relative;
			display: block;
			width: 100%;
			height: 100%;
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
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			object-fit: contain;
			pointer-events: none;
			image-rendering: pixelated;
		}

		@media (max-width: 600px) {
			.game-area {
				width: 100vw;
				height: 100vw;
				max-width: 100vw;
				max-height: 100vw;
			}
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
