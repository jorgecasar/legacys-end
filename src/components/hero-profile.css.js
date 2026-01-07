import { css } from "lit";
import { sharedStyles } from "../styles/shared.js";

export const styles = [
	...sharedStyles,
	css`
    :host {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      transition: all 0.5s;
    }

    /* Nameplate (Bottom) */
    .nameplate {
      position: absolute;
      bottom: -2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      z-index: 20;
      white-space: nowrap;
    }
    
    /* Tooltip (Top) */
    .hero-tooltip {
      position: absolute;
      top: -3rem;
      background-color: var(--wa-color-surface-default);
      color: var(--wa-color-text-normal);
      padding: var(--wa-space-xs) var(--wa-space-s);
      border-radius: var(--wa-border-radius-m);
      font-size: var(--wa-font-size-2xs);
      box-shadow: var(--wa-shadow-medium);
      pointer-events: none;
      z-index: 25;
      white-space: nowrap;
      animation: float 3s ease-in-out infinite;
      border: var(--wa-border-width-s) solid var(--wa-color-neutral-border-normal);
    }
    
    .hero-tooltip::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 6px 6px 0;
      border-style: solid;
      border-color: var(--wa-color-neutral-border-normal) transparent transparent transparent;
    }
    .loading {
      animation: bounce 1s infinite;
      font-size: var(--wa-font-size-2xs);
      font-weight: bold;
      text-shadow: var(--wa-shadow-small);
    }
    .error {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      color: var(--wa-color-danger-fill-loud);
      font-weight: 900;
      text-shadow: var(--wa-shadow-small);
    }
    .name-tag {
      box-shadow: var(--wa-shadow-small);
      white-space: nowrap;
    }
    .badge-container {
      display: flex;
      gap: var(--wa-space-2xs);
      margin-top: var(--wa-space-3xs);
    }
    .role-badge {
      color: #fef08a;
      font-weight: bold;
      text-shadow: var(--wa-shadow-small);
      background-color: rgba(0, 0, 0, 0.3);
      padding: 0 var(--wa-space-2xs);
      border-radius: var(--wa-border-radius-s);
    }
    .service-dot {
      width: var(--wa-space-xs);
      height: var(--wa-space-xs);
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .dot-legacy { background-color: var(--wa-color-danger-fill-loud); }
    .dot-mock { background-color: var(--wa-color-warning-fill-loud); }
    .dot-new { background-color: var(--wa-color-success-fill-loud); }

    /* Character Image */
    .character-img {
      width: 100%;
      height: 100%;
      aspect-ratio: 1;
	  object-fit: contain;
	  transition: all 0.5s ease-in-out;
    }
    :host(.wa-dark) .character-img {
       filter: drop-shadow(0 0 10px rgba(99,102,241,0.6));
    }
    :host(.injection-legacy-api) .character-img {
       filter: drop-shadow(0 0 10px var(--wa-color-danger-fill-loud));
    }
	:host(.injection-mock-api) .character-img {
       filter: drop-shadow(0 0 10px var(--wa-color-warning-fill-loud));
    }
    :host(.injection-new-api) .character-img {
       filter: drop-shadow(0 0 10px var(--wa-color-brand-fill-loud));
    }

	.gear-img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.weapon-img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
	}

    @keyframes bounce {
      0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
      50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
    }
    @keyframes pulse {
      50% { opacity: .5; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `,
];
