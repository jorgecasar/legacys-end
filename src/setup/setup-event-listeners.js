/**
 * EventBus Listeners - Analytics and Debug Logging
 *
 * This file sets up global event listeners for the EventBus
 * to provide analytics tracking and debug logging.
 */

import { eventBus, GameEvents } from "../core/event-bus.js";
import { logger } from "../services/logger-service.js";

/**
 * Setup analytics listeners
 * Tracks important game events for analytics
 */
export function setupAnalyticsListeners() {
	// Track quest lifecycle
	eventBus.on(GameEvents.QUEST_STARTED, (data) => {
		logger.info("📊 [Analytics] Quest started:", data.questId);
		// In production, this would send to analytics service
		// analytics.track('quest_start', { questId: data.questId });
	});

	eventBus.on(GameEvents.QUEST_COMPLETE, (data) => {
		logger.info("📊 [Analytics] Quest completed:", data.questId);
		// analytics.track('quest_complete', { questId: data.questId });
	});

	eventBus.on(GameEvents.CHAPTER_START, (data) => {
		logger.info("📊 [Analytics] Chapter started:", data.chapterId);
		// analytics.track('chapter_start', { chapterId: data.chapterId });
	});

	eventBus.on(GameEvents.CHAPTER_COMPLETE, (data) => {
		logger.info("📊 [Analytics] Chapter completed:", data.chapterId);
		// analytics.track('chapter_complete', { chapterId: data.chapterId });
	});

	// Track errors
	eventBus.on(GameEvents.ERROR, (data) => {
		logger.error("📊 [Analytics] Error occurred:", data.message, data.error);
		// analytics.track('error', {
		//   message: data.message,
		//   context: data.context,
		//   stack: data.error?.stack
		// });
	});
}

/**
 * Setup debug listeners
 * Logs all events for debugging purposes
 */
export function setupDebugListeners() {
	const debugEvents = [
		GameEvents.HERO_MOVE,
		GameEvents.ITEM_COLLECT,
		GameEvents.REWARD_COLLECT,
		GameEvents.DIALOG_OPEN,
		GameEvents.DIALOG_CLOSE,
		GameEvents.PAUSE,
		GameEvents.RESUME,
		GameEvents.NAVIGATE_HUB,
		GameEvents.NAVIGATE_QUEST,
		GameEvents.LOADING_START,
		GameEvents.LOADING_END,
	];

	debugEvents.forEach((event) => {
		eventBus.on(event, (data) => {
			logger.debug(`🔍 [Debug] ${event}:`, data);
		});
	});
}

/**
 * Setup performance monitoring listeners
 * Tracks loading times and performance metrics
 */
export function setupPerformanceListeners() {
	const loadingTimes = new Map();

	eventBus.on(GameEvents.LOADING_START, (data) => {
		loadingTimes.set(data.source, Date.now());
	});

	eventBus.on(GameEvents.LOADING_END, (data) => {
		const startTime = loadingTimes.get(data.source);
		if (startTime) {
			const duration = Date.now() - startTime;
			logger.info(`⏱️ [Performance] ${data.source} took ${duration}ms`);
			loadingTimes.delete(data.source);

			// In production, track slow operations
			if (duration > 1000) {
				logger.warn(
					`⚠️ [Performance] Slow operation: ${data.source} (${duration}ms)`,
				);
			}
		}
	});
}

/**
 * Initialize all event listeners
 * Call this once during app initialization
 */
export function initializeEventListeners() {
	setupAnalyticsListeners();

	// Only enable debug listeners in development
	if (import.meta.env.MODE === "development") {
		setupDebugListeners();
	}

	setupPerformanceListeners();

	logger.info("✅ EventBus listeners initialized");
}
