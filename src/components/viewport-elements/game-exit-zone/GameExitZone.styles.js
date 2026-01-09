import { css } from "lit";
import { sharedStyles } from "../../../styles/shared.js";

export const gameExitZoneStyles = [
	sharedStyles,
	css`
		:host {
			position: absolute;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
			transform: translate(-50%, -50%);
		}
	`,
];
