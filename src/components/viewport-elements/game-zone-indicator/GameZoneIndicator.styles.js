import { css } from "lit";
import { sharedStyles } from "../../../styles/shared.js";

export const gameZoneIndicatorStyles = [
	sharedStyles,
	css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			position: absolute;
			top: 0;
			left: 0;
			pointer-events: none;
			z-index: 1;
		}

		.zone {
			position: absolute;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			transition: all 0.5s;
			box-sizing: border-box;
		}

		/* =========================================
		   THEME ZONES (Matches GameThemeZones.styles.js)
		   ========================================= */
		.zone-theme-light {
			background-color: var(--wa-color-neutral-0);
			opacity: 0.1;
		}

		.zone-theme-dark {
			background-color: var(--wa-color-neutral-900);
			opacity: 0.1;
		}

		.zone-theme-label {
			font-family: 'Press Start 2P', monospace;
			font-size: var(--wa-font-size-2xl);
			z-index: 20;
		}

		.zone-theme-light .zone-theme-label {
			color: var(--wa-color-neutral-900);
		}

		.zone-theme-dark .zone-theme-label {
			color: var(--wa-color-neutral-0);
		}

		/* =========================================
		   CONTEXT ZONES (Matches GameContextZones.styles.js)
		   ========================================= */
		.zone-context {
			padding: var(--wa-space-m);
			/* Note: Original used height: ~50% top: 43%.
			   New system uses dynamic height/top.
			   We assume layout is handled by inline styles.
			   We just apply the decorative styles here. */
			border-radius: 0;
			border: var(--wa-border-width-s) solid var(--wa-color-neutral-border-normal);
		}

		/* Legacy State Styles */
		.zone-context-legacy.inactive {
			border: 2px solid var(--wa-color-danger-border-normal);
			background-color: color-mix(in oklab, var(--wa-color-danger-fill-loud) 25%, transparent);
		}

		.zone-context-legacy.active {
			border: var(--wa-border-width-l) solid var(--wa-color-danger-border-loud);
			background-color: color-mix(in oklab, var(--wa-color-danger-fill-loud) 10%, transparent);
		}

		/* New State Styles */
		.zone-context-new.inactive {
			border: 2px solid var(--wa-color-brand-border-normal);
			background-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 25%, transparent);
		}

		.zone-context-new.active {
			border: var(--wa-border-width-l) solid var(--wa-color-brand-border-loud);
			background-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 10%, transparent);
		}

		.ctx-title {
			font-weight: bold;
			text-transform: uppercase;
			margin-bottom: var(--wa-space-xs);
			margin-top: 0;
			/* Original font size? */
		}

		/* =========================================
		   TRAFFIC LIGHT ZONES
		   ========================================= */
		.zone-traffic-light {
			border-radius: 100%;
			border: none;
		}

		.zone-crosswalk {
			border-radius: 0;
			border: none;
			background: linear-gradient(
				90deg,
				transparent 0%, transparent 22%,
				var(--band-color, transparent) 22%, var(--band-color, transparent) 29%,
				transparent 29%, transparent 36%,
				var(--band-color, transparent) 36%, var(--band-color, transparent) 44%,
				transparent 44%, transparent 51%,
				var(--band-color, transparent) 51%, var(--band-color, transparent) 58%,
				transparent 58%, transparent 65%,
				var(--band-color, transparent) 65%, var(--band-color, transparent) 73%,
				transparent 73%, transparent 80%,
				var(--band-color, transparent) 80%, var(--band-color, transparent) 87.2%,
				transparent 87.2%, transparent 100%
			);
		}

		.zone-safe {
			background-color: var(--wa-color-success-fill-loud);
		}

		.zone-danger {
			background-color: var(--wa-color-danger-fill-loud);
		}

		.zone-crosswalk.zone-safe {
			--band-color: color-mix(in oklab, var(--wa-color-success-fill-loud) 70%, transparent);
			background-color: transparent;
		}

		.zone-crosswalk.zone-danger {
			--band-color: color-mix(in oklab, white 70%, transparent);
			background-color: transparent;
		}

		.zone-traffic-light.zone-safe {
			background-color: var(--wa-color-success-fill-loud);
			box-shadow: 0 0 10px 5px var(--wa-color-success-fill-loud);
		}

		.zone-traffic-light.zone-danger {
			background-color: var(--wa-color-danger-fill-loud);
			box-shadow: 0 0 10px 5px var(--wa-color-danger-fill-loud);
		}
	`,
];
