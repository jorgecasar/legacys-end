import { ContextConsumer } from "@lit/context";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { themeContext } from "../contexts/theme-context.js";
import { ZoneTypes } from "../core/constants.js";
import { gameStoreContext } from "../core/store.js";

/**
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveElement} ReactiveElement
 */

/**
 * @typedef {import('../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../types/game.d.js').IQuestStateService} IQuestStateService
 * @typedef {import('../types/services.d.js').IQuestController} IQuestController
 * @typedef {import('../types/services.d.js').IThemeService} IThemeService
 */

/**
 * @typedef {Object} GameZoneUseCases
 * @property {import('../use-cases/process-game-zone-interaction.js').ProcessGameZoneInteractionUseCase} processGameZoneInteraction
 */

/**
 * GameZoneController - Handles theme and context zone changes
 *
 * Logic:
 * - Defines zones (start, middle, end) based on Chapter ID
 * - Updates theme mode based on hero position
 * - Updates character context (hot switch) based on zones
 *
 * ReactiveController pattern:
 * - Checks zones on host update via heroPos signal
 *
 * @implements {ReactiveController}
 */
export class GameZoneController {
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {IQuestStateService | null} */
	#questState = null;
	/** @type {IQuestController | null} */
	#questController = null;
	/** @type {IThemeService | null} */
	#themeService = null;

	/**
	 * @param {ReactiveControllerHost} host
	 * @param {GameZoneUseCases} useCases
	 */
	constructor(host, useCases) {
		/** @type {ReactiveControllerHost} */
		this.host = host;
		this.useCases = useCases;

		/** @type {{x: number, y: number, hasCollectedItem: boolean} | null} */
		this.lastPos = null;

		const hostElement = /** @type {ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// Initialize Context Consumers
		new ContextConsumer(hostElement, {
			context: gameStoreContext,
			subscribe: true,
			callback: (store) => {
				if (store) {
					this.#heroState = store.hero;
					this.#questState = store.quest;
				}
			},
		});

		new ContextConsumer(hostElement, {
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = /** @type {IQuestController} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: themeContext,
			subscribe: true,
			callback: (service) => {
				this.#themeService = /** @type {IThemeService} */ (service);
			},
		});

		host.addController(this);
	}

	hostConnected() {}

	hostDisconnected() {}

	hostUpdate() {
		if (!this.#heroState || !this.#questState) return;

		const pos = this.#heroState.pos.get();
		const hasCollectedItem = this.#questState.hasCollectedItem.get();

		// Prevent redundant checks if position hasn't changed
		if (
			this.lastPos &&
			this.lastPos.x === pos.x &&
			this.lastPos.y === pos.y &&
			this.lastPos.hasCollectedItem === hasCollectedItem
		) {
			return;
		}

		this.lastPos = { x: pos.x, y: pos.y, hasCollectedItem };
		this.checkZones(pos.x, pos.y, hasCollectedItem);
	}

	/**
	 * @param {{x: number, y: number, hasCollectedItem: boolean}} _data
	 */
	handleHeroMoved = (_data) => {
		this.hostUpdate();
	};

	/**
	 * Check if character is in a specific zone and trigger callbacks
	 * @param {number} x - Character X position (0-100)
	 * @param {number} y - Character Y position (0-100)
	 * @param {boolean} [hasCollectedItem]
	 */
	checkZones(x, y, hasCollectedItem = false) {
		const chapter = this.#questController?.currentChapter;
		if (!chapter) return;

		const results = this.useCases.processGameZoneInteraction.execute({
			x,
			y,
			chapter,
			hasCollectedItem,
		});

		// Handle THEME_CHANGE (Last one wins if multiple)
		const themeChange = [...results]
			.reverse()
			.find((r) => r.type === ZoneTypes.THEME_CHANGE);
		if (themeChange && this.#themeService) {
			this.#themeService.setTheme(themeChange.payload);
		}

		// Handle CONTEXT_CHANGE (Last one wins if multiple)
		const contextChange = [...results]
			.reverse()
			.find((r) => r.type === ZoneTypes.CONTEXT_CHANGE);
		if (contextChange && this.#heroState) {
			const currentContext = this.#heroState.hotSwitchState.get();
			if (currentContext !== contextChange.payload) {
				this.#heroState.setHotSwitchState(contextChange.payload);
			}
		}
	}
}
