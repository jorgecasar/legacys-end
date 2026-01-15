import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

/**
 * LegacysEndApp Styles
 */
export const legacysEndAppStyles = [
	...sharedStyles,
	css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      background-color: var(--wa-color-neutral-fill-loud);
      color: var(--wa-color-text-normal);
      position: relative;
      overflow: hidden;
      font-family: var(--wa-font-family-body);
      box-sizing: border-box;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      color: white;
    }

    main {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  `,
];
