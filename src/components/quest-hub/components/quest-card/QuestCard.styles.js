import { css } from "lit";

export const questCardStyles = css`
	:host {
		display: block;
	}

	.quest-card {
		height: 100%;
	}

	.quest-card.locked {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Variants */
	.quest-card.variant-brand {
		--wa-card-border-color: var(--wa-color-brand-600);
		--wa-card-border-top-width: 4px;
	}
	
	.quest-card.variant-success {
		--wa-card-border-color: #10b981;
		--wa-card-border-top-width: 4px;
	}
	
	.quest-card.variant-neutral {
		--wa-card-border-color: #6b7280;
	}

	.quest-card.completed {
		--wa-card-border-color: #10b981;
	}

	.quest-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: var(--wa-space-s);
	}

	.quest-description {
		flex: 1;
	}

	.quest-subtitle {
		font-style: italic;
		color: var(--wa-color-text-quiet);
		margin: 0;
	}

	.quest-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--wa-font-size-2xs);
	}

	.quest-time {
		opacity: 0.8;
		display: flex;
		align-items: center;
		gap: var(--wa-space-2xs);
	}
`;
