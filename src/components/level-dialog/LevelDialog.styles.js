import { css } from "lit";
import { sharedStyles } from "../../styles/shared.js";

export const levelDialogStyles = [
	...sharedStyles,
	css`
    :host {
      display: block;
    }

    /* Customizing wa-dialog */
    wa-dialog {
        --width: 80ch;
        --body-spacing: 0;
    }

    wa-dialog::part(panel) {
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        max-width: 100vw;
        border-radius: 0;
        margin: 0;
        /* display: flex; removed to fix footer visibility */
        /* flex-direction: column; removed */
    }
    wa-dialog::part(body) {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .dialog-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .indicators {
      display: flex;
      justify-content: center;
      gap: var(--wa-space-xs);
      margin-bottom: var(--wa-space-m);
    }

    .indicator {
      width: var(--wa-space-xs);
      height: var(--wa-space-xs);
      border: 1px solid black;
      transition: background-color 0.3s;
    }
    .indicator.active { background-color: black; }
    .indicator.inactive { background-color: #d1d5db; }

    .content-container {
      overflow-y: hidden; /* Scroll handled by children (code-block) */
      animation: fadeIn 0.3s ease-in-out;
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .hint {
      font-size: var(--wa-font-size-2xs);
      color: var(--wa-color-neutral-40);
      display: flex;
      align-items: center;
      gap: var(--wa-space-2xs);
    }

    /* Slide Content Styles */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    h6 {
      font-size: var(--wa-font-size-2xs);
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: var(--wa-space-xs);
      text-align: center;
      margin-top: 0;
    }

    syntax-highlight {
      display: block;
      padding: var(--wa-space-m);
      border-width: var(--wa-border-width-l);
      border-style: solid;
      box-shadow: inset var(--wa-shadow-small);
      /* max-height removed */
      overflow: auto;
      font-family: var(--wa-font-family-code);
      font-size: var(--wa-font-size-s);
      line-height: var(--wa-line-height-normal);
      white-space: pre;
      flex: 1; /* Allow it to grow */
    }

	syntax-highlight.code-start {
		border-color: var(--wa-color-danger-border-loud);
	}
	syntax-highlight.code-end {
		border-color: var(--wa-color-success-border-loud);
	}

    .desc {
      font-size: var(--wa-font-size-2xs);
      color: var(--wa-color-neutral-40);
      text-align: center;
      font-style: italic;
      margin-top: var(--wa-space-xs);
      padding: 0 var(--wa-space-m);
      line-height: var(--wa-line-height-normal);
    }

    .narrative-icon {
      width: var(--wa-space-4xl);
      height: var(--wa-space-4xl);
      background-color: #fef9c3;
      border: var(--wa-border-width-l) solid #92400e;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0;
      font-size: var(--wa-font-size-xl);
      box-shadow: var(--wa-shadow-small);
      margin: 0 auto var(--wa-space-m) auto;
    }

    .analysis-item {
      display: flex;
      align-items: flex-start;
      gap: var(--wa-space-xs);
      font-size: var(--wa-font-size-2xs);
      color: #374151;
      background-color: #faf5ff;
      padding: var(--wa-space-xs);
      border: 1px solid #f3e8ff;
      border-radius: 0;
    }

    .console {
      background-color: #eef2ff;
      padding: var(--wa-space-s);
      border: var(--wa-border-width-m) solid #c7d2fe;
      box-shadow: var(--wa-shadow-small);
      margin-top: var(--wa-space-m);
    }

    .complete-btn {
      display: block;
      margin: 0;
      animation: bounce 1s infinite;
      --border-radius: 0;
    }
    
    /* Optional: Re-implement 3D effect if desired, but for now let's stick to a clean brand button */
    /* wa-button::part(base) { ... } */

    @keyframes bounce {
      0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
      50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
    }

	.slide-title {
		margin: 0;
	}
    .slide-title.code-start {
      color: var(--wa-color-danger-fill-loud);
    }

    .slide-title.code-end {
      color: var(--wa-color-success-fill-loud);
    }

    .slide-title-analysis {
      color: var(--wa-color-brand-fill-loud);
    }
    
    .slide-title-narrative {
      color: var(--wa-color-neutral-fill-loud);
    }

    .slide-content-centered {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .slide-content-between {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .problem-icon {
      background-color: var(--wa-color-danger-fill-quiet);
      border-color: var(--wa-color-danger-fill-loud);
    }

    .problem-icon-inner {
      font-size: 2.5rem;
      color: var(--wa-color-danger-fill-loud);
    }

    .narrative-icon-inner {
      font-size: 2.5rem;
      color: #92400e; /* Keeping specific brown for scroll/narrative feel if no token matches perfectly, or use neutral-loud */
    }

    .narrative-text {
      font-size: var(--wa-font-size-xs);
      text-align: center;
      padding: 0 var(--wa-space-l);
      color: var(--wa-color-text-quiet);
    }

    .analysis-list {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-s);
      padding: 0 var(--wa-space-xs);
    }

    .analysis-arrow {
      color: var(--wa-color-brand-fill-loud);
    }

    .console-title {
      font-size: var(--wa-font-size-2xs);
      font-weight: bold;
      margin-bottom: var(--wa-space-xs);
      text-align: center;
      color: var(--wa-color-brand-fill-loud);
    }

    .console-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--wa-space-m);
    }

    .status-dot {
      width: var(--wa-space-s);
      height: var(--wa-space-s);
      border-radius: 0;
      background-color: var(--wa-color-neutral-20);
    }

    .status-dot.legacy {
      background-color: var(--wa-color-danger-fill-loud);
    }

    .status-dot.new {
      background-color: var(--wa-color-success-fill-loud);
    }
    
    .pulse {
      animation: pulse 2s infinite;
    }

    .console-status-text {
      font-size: var(--wa-font-size-2xs);
      text-align: center;
      margin-top: var(--wa-space-xs);
      color: var(--wa-color-brand-fill-loud);
    }

    .quest-complete-container {
      text-align: center;
      padding: var(--wa-space-m);
    }

    .quest-complete-title {
      color: var(--wa-color-success-fill-loud);
    }

    .quest-complete-text {
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-text-quiet);
    }

    .spacer-top {
      padding-top: var(--wa-space-m);
    }
    
    @keyframes pulse {
      50% { opacity: .5; }
    }

    .reward-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--wa-space-m);
      margin-top: var(--wa-space-m);
    }

    .reward-img {
      width: 196px;
      height: 196px;
      object-fit: contain;
      filter: drop-shadow(var(--wa-shadow-offset-x-m) var(--wa-shadow-offset-y-m) var(--wa-shadow-spread-m) var(--wa-color-shadow));
    }

    .reward-info {
      text-align: center;
    }

    .reward-name {
      font-size: var(--wa-font-size-l);
      font-weight: bold;
      margin: 0 0 var(--wa-space-xs) 0;
      color: var(--wa-color-brand-fill-loud);
    }

    .reward-desc {
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-quiet);
      margin: 0;
    }
	`,
];
