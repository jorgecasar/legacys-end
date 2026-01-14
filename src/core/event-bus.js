/**
 * Event Bus - Mediator Pattern for Decoupled Communication
 *
 * Allows components to communicate without knowing about each other.
 * Implements the Publish-Subscribe pattern.
 *
 * Benefits:
 * - Loose coupling between components
 * - Easy to add new listeners without modifying emitters
 * - Centralized event logging and debugging
 * - Type-safe events (via JSDoc)
 */

/**
 * @template T
 * @typedef {(data: T) => void} EventCallback
 */

/**
 * @typedef {() => void} UnsubscribeFunction
 */

export class EventBus {
	constructor() {
		/** @type {Map<string, Set<Function>>} */
		this._listeners = new Map();

		/** @type {boolean} */
		this._debugMode = false;

		/** @type {Array<{event: string, data: any, timestamp: number}>} */
		this._eventHistory = [];

		/** @type {number} */
		this._maxHistorySize = 100;
	}

	/**
	 * Subscribe to an event
	 * @template T
	 * @param {string} event - Event name
	 * @param {EventCallback<T>} callback - Callback function
	 * @returns {UnsubscribeFunction} Function to unsubscribe
	 */
	on(event, callback) {
		if (!this._listeners.has(event)) {
			this._listeners.set(event, new Set());
		}

		const listeners = this._listeners.get(event);
		if (listeners) {
			listeners.add(callback);
		}

		// Return unsubscribe function
		return () => this.off(event, callback);
	}

	/**
	 * Subscribe to an event (one-time only)
	 * @template T
	 * @param {string} event - Event name
	 * @param {EventCallback<T>} callback - Callback function
	 * @returns {UnsubscribeFunction} Function to unsubscribe
	 */
	once(event, callback) {
		/** @param {T} data */
		const wrappedCallback = (data) => {
			callback(data);
			this.off(event, wrappedCallback);
		};

		return this.on(event, wrappedCallback);
	}

	/**
	 * Unsubscribe from an event
	 * @param {string} event - Event name
	 * @param {Function} callback - Callback to remove
	 */
	off(event, callback) {
		const callbacks = this._listeners.get(event); // Changed from this.listeners to this._listeners
		if (!callbacks) return;

		// Assuming the intent is to remove from a Set, not an Array
		callbacks.delete(callback);

		// Clean up empty listener sets
		if (callbacks.size === 0) {
			this._listeners.delete(event);
		}
	}

	/**
	 * Emit an event to all subscribers
	 * @template T
	 * @param {string} event - Event name
	 * @param {T} [data] - Event data
	 */
	emit(event, data) {
		// Log to history
		if (this._eventHistory.length >= this._maxHistorySize) {
			this._eventHistory.shift();
		}
		this._eventHistory.push({
			event,
			data,
			timestamp: Date.now(),
		});

		// Debug logging
		if (this._debugMode) {
			console.log(`[EventBus] ${event}`, data);
		}

		// Notify all listeners
		const listeners = this._listeners.get(event);
		if (listeners) {
			// Create array to avoid issues if listeners modify the set during iteration
			const listenersArray = Array.from(listeners);
			for (const callback of listenersArray) {
				try {
					callback(data);
				} catch (error) {
					console.error(`[EventBus] Error in listener for "${event}":`, error);
				}
			}
		}
	}

	/**
	 * Remove all listeners for an event (or all events)
	 * @param {string} [event] - Event name (omit to clear all)
	 */
	clear(event) {
		if (event) {
			this._listeners.delete(event);
		} else {
			this._listeners.clear();
		}
	}

	/**
	 * Get number of listeners for an event
	 * @param {string} event - Event name
	 * @returns {number}
	 */
	listenerCount(event) {
		return this._listeners.get(event)?.size || 0;
	}

	/**
	 * Get all event names that have listeners
	 * @returns {string[]}
	 */
	eventNames() {
		return Array.from(this._listeners.keys());
	}

	/**
	 * Enable/disable debug mode
	 * @param {boolean} enabled
	 */
	setDebugMode(enabled) {
		this._debugMode = enabled;
	}

	/**
	 * Get event history (for debugging)
	 * @param {number} [limit] - Max number of events to return
	 * @returns {Array<{event: string, data: any, timestamp: number}>}
	 */
	getHistory(limit) {
		const history = [...this._eventHistory];
		return limit ? history.slice(-limit) : history;
	}

	/**
	 * Clear event history
	 */
	clearHistory() {
		this._eventHistory = [];
	}
}

// Export singleton instance
export const eventBus = new EventBus();

/**
 * Common game events (for type safety and documentation)
 * Consolidated from legacy EVENTS constant
 */
export const GameEvents = {
	// Quest events
	/** @type {'quest:started'} */
	QUEST_STARTED: "quest:started",
	/** @type {'quest:complete'} */
	QUEST_COMPLETE: "quest:complete",
	/** @type {'quest:failed'} */
	QUEST_FAILED: "quest:failed",
	/** @type {'return-to-hub'} */
	RETURN_TO_HUB: "return-to-hub",

	// Chapter events
	/** @type {'chapter-changed'} */
	CHAPTER_CHANGED: "chapter-changed",
	/** @type {'chapter:start'} */
	CHAPTER_START: "chapter:start",
	/** @type {'chapter:complete'} */
	CHAPTER_COMPLETE: "chapter:complete",

	// Hero/Movement events
	/** @type {'hero:move'} */
	HERO_MOVE: "hero:move",
	/** @type {'hero-moved'} */
	HERO_MOVED: "hero-moved",
	/** @type {'hero-auto-move'} */
	HERO_AUTO_MOVE: "hero-auto-move",
	/** @type {'hero-move-input'} */
	HERO_MOVE_INPUT: "hero-move-input",

	// Item/Reward events
	/** @type {'item:collect'} */
	ITEM_COLLECT: "item:collect",
	/** @type {'reward:collect'} */
	REWARD_COLLECT: "reward:collect",

	// Dialog/UI events
	/** @type {'dialog:open'} */
	DIALOG_OPEN: "dialog:open",
	/** @type {'dialog:close'} */
	DIALOG_CLOSE: "dialog:close",

	/** @type {'dialog-next'} */
	DIALOG_NEXT: "dialog-next",
	/** @type {'dialog-prev'} */
	DIALOG_PREV: "dialog-prev",
	/** @type {'slide-changed'} */
	SLIDE_CHANGED: "slide-changed",

	// Level/Zone events
	/** @type {'level-completed'} */
	LEVEL_COMPLETED: "level-completed",
	/** @type {'exit-zone-reached'} */
	EXIT_ZONE_REACHED: "exit-zone-reached",

	// Game state events
	/** @type {'game:pause'} */
	PAUSE: "game:pause",
	/** @type {'game:resume'} */
	RESUME: "game:resume",

	// Navigation events
	/** @type {'navigate:hub'} */
	NAVIGATE_HUB: "navigate:hub",
	/** @type {'navigate:quest'} */
	NAVIGATE_QUEST: "navigate:quest",

	// Theme events
	/** @type {'theme-changed'} */
	THEME_CHANGED: "theme-changed",

	// System events
	/** @type {'error'} */
	ERROR: "error",
	/** @type {'warning'} */
	WARNING: "warning",
	/** @type {'loading:start'} */
	LOADING_START: "loading:start",
	/** @type {'loading:end'} */
	LOADING_END: "loading:end",
};
