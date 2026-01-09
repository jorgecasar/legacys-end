import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const gameHudStyles = [
	...sharedStyles,
	css`
		:host {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: var(--wa-space-m) var(--wa-space-m);
			box-sizing: border-box;
			color: var(--wa-color-text-default);
			z-index: 50;
			background-color: var(--wa-color-surface-default);
		}

		.wa-stack {
			flex-direction: column-reverse;
		}

		h5 {
			margin: 0;
		color: var(--wa-color-text-quiet);
		}

		.chapter-counter {
			font-weight: var(--wa-font-weight-bold);
			color: var(--wa-color-text-quiet);
		}

		.chapter-total {
			font-size: var(--wa-font-size-s);
			color: var(--wa-color-text-normal);
		}
  `,
];
