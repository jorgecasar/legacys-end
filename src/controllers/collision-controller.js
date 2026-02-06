import { ContextConsumer } from "@lit/context";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { heroStateContext } from "../game/contexts/hero-context.js";
import { questStateContext } from "../game/contexts/quest-context.js";

/**
 * @typedef {import("lit").ReactiveController} ReactiveController
 * @typedef {import("lit").ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import("lit").ReactiveElement} ReactiveElement
 */

/**
 * @typedef {import('../types/game.d.js').IHeroStateService} IHeroStateService
 * @typedef {import('../types/game.d.js').IQuestStateService} IQuestStateService
 * @typedef {import('../types/services.d.js').IQuestController} IQuestController
 */

/**
 * @typedef {Object} Box
 * @property {number} x - Center X coordinate
 * @property {number} y - Center Y coordinate
 * @property {number} width - Width of the box
 * @property {number} height - Height of the box
 */

/**
 * @typedef {Object} CollisionOptions
 * @property {number} [heroSize=2.5] - Half-size of hero hitbox
 */

/**
 * CollisionController - Handles collision detection and exit zones
 *
 * Checks:
 * - AABB collisions with obstacles (via checkCollision)
 * - Exit zone entry (via checkExitZone)
 *
 * ReactiveController pattern:
 * - Checks exit zone on host update via heroPos signal
 *
 * @implements {ReactiveController}
 */
export class CollisionController {
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {IQuestStateService | null} */
	#questState = null;
	/** @type {IQuestController | null} */
	#questController = null;

	/**
	 * @param {ReactiveControllerHost} host
	 * @param {CollisionOptions} [options]
	 */
	constructor(host, options = {}) {
		/** @type {ReactiveControllerHost} */
		this.host = host;
		this.options = {
			heroSize: 2.5,
			...options,
		};

		const hostElement = /** @type {ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// Initialize Context Consumers
		new ContextConsumer(hostElement, {
			context: heroStateContext,
			subscribe: true,
			callback: (service) => {
				this.#heroState = /** @type {IHeroStateService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: questStateContext,
			subscribe: true,
			callback: (service) => {
				this.#questState = /** @type {IQuestStateService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = /** @type {IQuestController} */ (service);
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
		const currentChapter = this.#questController?.currentChapter;

		if (currentChapter?.exitZone) {
			this.checkExitZone(
				pos.x,
				pos.y,
				currentChapter.exitZone,
				hasCollectedItem,
			);
		}
	}

	/**
	 * Check if hero collides with exit zone
	 * @param {number} x - Hero X position
	 * @param {number} y - Hero Y position
	 * @param {Box|null} exitZone - Exit zone definition
	 * @param {boolean} hasCollectedItem - Whether hero has collected the item
	 * @returns {boolean} True if collision occurred
	 */
	checkExitZone(x, y, exitZone, hasCollectedItem) {
		if (!hasCollectedItem || !exitZone) {
			return false;
		}

		const heroHalfSize = this.options.heroSize;

		// Hero bounding box
		const hLeft = x - heroHalfSize;
		const hRight = x + heroHalfSize;
		const hTop = y - heroHalfSize;
		const hBottom = y + heroHalfSize;

		// Exit zone bounding box
		const eLeft = exitZone.x - exitZone.width / 2;
		const eRight = exitZone.x + exitZone.width / 2;
		const eTop = exitZone.y - exitZone.height / 2;
		const eBottom = exitZone.y + exitZone.height / 2;

		// AABB collision detection
		const collided =
			hLeft < eRight && hRight > eLeft && hTop < eBottom && hBottom > eTop;

		if (collided) {
			/** @type {import('../components/game-viewport/GameViewport.js').GameViewport} */ (
				this.host
			).gameController?.handleExitZoneReached();
		}

		return collided;
	}

	/**
	 * Generic AABB collision check
	 * @param {Box} box1
	 * @param {Box} box2
	 * @returns {boolean} True if boxes collide
	 */
	checkAABB(box1, box2) {
		const b1Left = box1.x - box1.width / 2;
		const b1Right = box1.x + box1.width / 2;
		const b1Top = box1.y - box1.height / 2;
		const b1Bottom = box1.y + box1.height / 2;

		const b2Left = box2.x - box2.width / 2;
		const b2Right = box2.x + box2.width / 2;
		const b2Top = box2.y - box2.height / 2;
		const b2Bottom = box2.y + box2.height / 2;

		return (
			b1Left < b2Right &&
			b1Right > b2Left &&
			b1Top < b2Bottom &&
			b1Bottom > b2Top
		);
	}
}
