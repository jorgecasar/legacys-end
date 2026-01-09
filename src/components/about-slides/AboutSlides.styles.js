import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const aboutSlidesStyles = [
	...sharedStyles,
	css`
		:host {
			display: block;
		}

		wa-carousel {
			--aspect-ratio: 16/9;
			width: 100%;
		}

		wa-carousel-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			text-align: center;
			padding: 2rem;
		}

		h2 {
			font-family: 'Press Start 2P', monospace;
			font-size: 1.5rem;
			margin-bottom: 1rem;
			color: var(--wa-color-primary-text);
		}

		p {
			font-family: var(--wa-font-sans);
			font-size: 1.2rem;
			line-height: 1.6;
			margin-bottom: 1rem;
		}

		ul {
			list-style-type: none;
			padding: 0;
		}

		li {
			margin: 0.5rem 0;
			font-size: 1.1rem;
		}
	`,
];
