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

		this._listeners.get(event).add(callback);

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
		const wrappedCallback = (data) => {
			callback(data);
			this.off(event, wrappedCallback);
		};

		return this.on(event, wrappedCallback);
	}

	/**
	 * Unsubscribe from an event
	 * @param {string} event - Event name
	 * @param {Function} callback - Callback function to remove
	 */
	off(event, callback) {
		const listeners = this._listeners.get(event);
		if (listeners) {
			listeners.delete(callback);

			// Clean up empty listener sets
			if (listeners.size === 0) {
				this._listeners.delete(event);
			}
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
 */
export const GameEvents = {
	// Quest events
	QUEST_START: "quest:start",
	QUEST_COMPLETE: "quest:complete",
	QUEST_FAILED: "quest:failed",

	// Chapter events
	CHAPTER_START: "chapter:start",
	CHAPTER_COMPLETE: "chapter:complete",

	// Game state events
	HERO_MOVE: "hero:move",
	ITEM_COLLECT: "item:collect",
	REWARD_COLLECT: "reward:collect",

	// UI events
	DIALOG_OPEN: "dialog:open",
	DIALOG_CLOSE: "dialog:close",
	PAUSE: "game:pause",
	RESUME: "game:resume",

	// Navigation events
	NAVIGATE_HUB: "navigate:hub",
	NAVIGATE_QUEST: "navigate:quest",

	// Error events
	ERROR: "error",
	WARNING: "warning",

	// System events
	LOADING_START: "loading:start",
	LOADING_END: "loading:end",
};
