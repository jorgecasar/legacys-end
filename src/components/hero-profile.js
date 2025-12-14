import { LitElement, html, css } from 'lit';
import { ContextConsumer } from '@lit/context';
import { profileContext } from '../contexts/profile-context.js';
import { themeContext } from '../contexts/theme-context.js';
import { suitContext } from '../contexts/suit-context.js';
import { gearContext } from '../contexts/gear-context.js';
import { powerContext } from '../contexts/power-context.js';
import { masteryContext } from '../contexts/mastery-context.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import { sharedStyles } from '../styles/shared.js';

export class HeroProfile extends LitElement {
	static properties = {
		imageSrc: { type: String },
		profileData: { state: true },
		themeData: { state: true },
		suitData: { state: true },
		gearData: { state: true },
		powerData: { state: true },
		masteryData: { state: true },
		masteryData: { state: true },
		tooltipText: { type: String },
		hotSwitchState: { type: String }
	};

	constructor() {
		super();
		this.imageSrc = '';
		this.tooltipText = '';

		// Initialize context consumers
		new ContextConsumer(this, {
			context: profileContext,
			callback: (value) => { this.profileData = value; },
			subscribe: true
		});
		new ContextConsumer(this, {
			context: themeContext,
			callback: (value) => { this.themeData = value; },
			subscribe: true
		});
		new ContextConsumer(this, {
			context: suitContext,
			callback: (value) => { this.suitData = value; },
			subscribe: true
		});
		new ContextConsumer(this, {
			context: gearContext,
			callback: (value) => { this.gearData = value; },
			subscribe: true
		});
		new ContextConsumer(this, {
			context: powerContext,
			callback: (value) => { this.powerData = value; },
			subscribe: true
		});
		new ContextConsumer(this, {
			context: masteryContext,
			callback: (value) => { this.masteryData = value; },
			subscribe: true
		});
	}

	updated(changedProperties) {
		if (changedProperties.has('themeData') && this.themeData) {
			if (this.themeData.themeMode === 'dark') {
				this.classList.add('wa-dark');
			} else {
				this.classList.remove('wa-dark');
			}
		}

		if (changedProperties.has('hotSwitchState')) {
			this.classList.remove('injection-mock-api', 'injection-legacy-api', 'injection-new-api');
			if (this.hotSwitchState) {
				this.classList.add(`injection-${this.hotSwitchState}-api`);
			}
		}
	}

	static styles = [
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
	:host(.injection-test-api) .character-img {
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
  `];

	render() {
		const { name, role, loading, error, serviceName } = this.profileData || {};

		return html`
        <!-- Optional Tooltip -->
        ${this.tooltipText ? html`
          <div class="hero-tooltip">${this.tooltipText}</div>
        ` : ''}

        <!-- Character Image -->
        ${(this.suitData?.image || this.imageSrc) ? html`
            <img src="${this.suitData?.image || this.imageSrc}" class="character-img" alt="Alarion" />
        ` : ''}

		<!-- Gear Image -->
		${this.gearData?.image ? html`
			<img src="${this.gearData.image}" class="gear-img" alt="Gear" />
		` : ''}

		<!-- Weapon Image -->
		${this.powerData?.image ? html`
			<img src="${this.powerData.image}" class="weapon-img" alt="Weapon" />
		` : ''}

        <!-- Nameplate (Bottom) -->
        <div class="nameplate">
          ${loading
				? html`<span class="loading">...</span>`
				: error
					? html`<span class="error">${error}</span>`
					: html`
                  <wa-tag variant="neutral" size="small" pill class="name-tag">${name || 'Alarion'}</wa-tag>
                `}
        </div>
    `;
	}
}

customElements.define('hero-profile', HeroProfile);
