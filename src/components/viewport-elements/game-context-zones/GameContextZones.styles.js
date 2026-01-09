import { css } from "lit";
import { sharedStyles } from "../../../styles/shared.js";

export const gameContextZonesStyles = [
	sharedStyles,
	css`
		/* Level 6 Zones */
		.ctx-zone {
			position: absolute;
			top: 43%;
			bottom: 0;
			width: 50%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: flex-start;
			padding: var(--wa-space-m);
			border-radius: var(--wa-border-radius-circle);
			border: var(--wa-border-width-s) solid var(--wa-color-neutral-border-normal);
			transition: all 0.5s;
		}

		.ctx-legacy {
			left: 50%;
		}

		.ctx-new {
			left: 0%;
		}

		.ctx-legacy.inactive {
			border: var(--wa-border-width-s) solid var(--wa-color-danger-border-normal);
			background-color: color-mix(in oklab, var(--wa-color-danger-fill-loud) 0%, transparent);
		}

		.ctx-legacy.active {
			border: var(--wa-border-width-l) solid var(--wa-color-danger-border-loud);
			background-color: color-mix(in oklab, var(--wa-color-danger-fill-loud) 10%, transparent);
		}

		.ctx-new.inactive {
			border: var(--wa-border-width-s) solid var(--wa-color-brand-border-normal);
			background-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 0%, transparent);
		}

		.ctx-new.active {
			border: var(--wa-border-width-l) solid var(--wa-color-brand-border-loud);
			background-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 10%, transparent);
		}

		.ctx-title {
			font-weight: bold;
			text-transform: uppercase;
			margin-bottom: var(--wa-space-xs);
			margin-top: 0;
		}
	`,
];
