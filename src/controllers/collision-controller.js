/**
 * CollisionController - Handles collision detection
 * 
 * Handles:
 * - AABB (Axis-Aligned Bounding Box) collision detection
 * - Exit zone collision for level transitions
 * 
 * Usage:
 * ```js
 * this.collision = new CollisionController(this, {
 *   onExitCollision: () => { this.triggerLevelTransition(); }
 * });
 * 
 * // Check collision when position changes
 * const collided = this.collision.checkExitZone(x, y, exitZone, hasCollectedItem);
 * ```
 */
export class CollisionController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = {
			heroSize: 2.5, // Half-size of hero hitbox
			onExitCollision: () => { },
			...options
		};

		host.addController(this);
	}

	hostConnected() {
		// No setup needed
	}

	hostDisconnected() {
		// No cleanup needed
	}

	/**
	 * Check if hero collides with exit zone
	 * @param {number} x - Hero X position
	 * @param {number} y - Hero Y position
	 * @param {Object} exitZone - Exit zone definition {x, y, width, height}
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
		const eLeft = exitZone.x - (exitZone.width / 2);
		const eRight = exitZone.x + (exitZone.width / 2);
		const eTop = exitZone.y - (exitZone.height / 2);
		const eBottom = exitZone.y + (exitZone.height / 2);

		// AABB collision detection
		const collided = hLeft < eRight && hRight > eLeft && hTop < eBottom && hBottom > eTop;

		if (collided) {
			this.options.onExitCollision();
		}

		return collided;
	}

	/**
	 * Generic AABB collision check
	 * @param {Object} box1 - {x, y, width, height}
	 * @param {Object} box2 - {x, y, width, height}
	 * @returns {boolean} True if boxes collide
	 */
	checkAABB(box1, box2) {
		const b1Left = box1.x - (box1.width / 2);
		const b1Right = box1.x + (box1.width / 2);
		const b1Top = box1.y - (box1.height / 2);
		const b1Bottom = box1.y + (box1.height / 2);

		const b2Left = box2.x - (box2.width / 2);
		const b2Right = box2.x + (box2.width / 2);
		const b2Top = box2.y - (box2.height / 2);
		const b2Bottom = box2.y + (box2.height / 2);

		return b1Left < b2Right && b1Right > b2Left && b1Top < b2Bottom && b1Bottom > b2Top;
	}
}
