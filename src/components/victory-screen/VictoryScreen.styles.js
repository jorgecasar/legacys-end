import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const victoryScreenStyles = [
	...sharedStyles,
	css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			position: absolute;
			top: 0; left: 0;
			background-color: rgba(0,0,0,0.9);
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
			animation: fade-in 1s ease-out;
		}

		.victory-screen {
			text-align: center;
			max-width: 800px;
			padding: 2rem;
			background-color: var(--wa-color-surface-default);
			color: var(--wa-color-text-normal);
			border-radius: var(--wa-border-radius-l);
			box-shadow: 0 0 50px rgba(251, 191, 36, 0.3);
			border: 4px solid #fbbf24;
		}

		.victory-title {
			font-family: var(--wa-font-family-heading);
			font-size: var(--wa-font-size-2xl);
			color: #fbbf24;
			text-shadow: 2px 2px 0 #000;
			margin-bottom: 2rem;
			animation: bounce-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		}

		.victory-text {
			font-family: var(--wa-font-family-body);
			font-size: var(--wa-font-size-l);
			margin-bottom: 2rem;
			line-height: 1.6;
		}

		.rewards-list {
			list-style: none;
			padding: 0;
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
			justify-content: center;
			gap: 2rem;
			margin: 2rem 0;
		}

		.reward-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
			animation: pop-in 0.5s ease-out backwards;
			animation-delay: calc(var(--index, 0) * 0.2s + 0.5s);
		}

		.reward-img {
			width: 64px;
			height: 64px;
			object-fit: contain;
			filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
		}

		.reward-name {
			font-size: var(--wa-font-size-xs);
			font-weight: bold;
			color: var(--wa-color-text-quiet);
		}

		.ng-btn {
			font-size: var(--wa-font-size-l);
			--border-radius: 0;
			animation: pulse 2s infinite;
		}

		@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
		@keyframes bounce-in { 
			0% { transform: scale(0); opacity: 0; } 
			60% { transform: scale(1.1); opacity: 1; }
			100% { transform: scale(1); }
		}
		@keyframes pop-in {
			from { transform: scale(0) translateY(20px); opacity: 0; }
			to { transform: scale(1) translateY(0); opacity: 1; }
		}
		@keyframes pulse {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.05); }
		}
	`,
];
