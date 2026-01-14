import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus, GameEvents } from "../core/event-bus.js";
import { logger } from "../services/logger-service.js";
import {
	initializeEventListeners,
	setupAnalyticsListeners,
	setupDebugListeners,
	setupPerformanceListeners,
} from "./setup-event-listeners.js";

describe("EventBus Listeners", () => {
	beforeEach(() => {
		// Clear all event listeners before each test
		eventBus.clear();
		vi.clearAllMocks();
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
	});

	describe("setupAnalyticsListeners", () => {
		it("should log quest start events", () => {
			const logSpy = vi.spyOn(logger, "info");
			setupAnalyticsListeners();

			eventBus.emit(GameEvents.QUEST_STARTED, { questId: "test-quest" });

			expect(logSpy).toHaveBeenCalledWith(
				"📊 [Analytics] Quest started:",
				"test-quest",
			);
		});

		it("should log quest complete events", () => {
			const logSpy = vi.spyOn(logger, "info");
			setupAnalyticsListeners();

			eventBus.emit(GameEvents.QUEST_COMPLETE, { questId: "test-quest" });

			expect(logSpy).toHaveBeenCalledWith(
				"📊 [Analytics] Quest completed:",
				"test-quest",
			);
		});

		it("should log error events", () => {
			const logSpy = vi.spyOn(logger, "error");
			setupAnalyticsListeners();

			const error = new Error("Test error");
			eventBus.emit(GameEvents.ERROR, {
				message: "Test error message",
				error,
			});

			expect(logSpy).toHaveBeenCalledWith(
				"📊 [Analytics] Error occurred:",
				"Test error message",
				error,
			);
		});
	});

	describe("setupDebugListeners", () => {
		it("should log debug events", () => {
			const logSpy = vi.spyOn(logger, "debug");
			setupDebugListeners();

			eventBus.emit(GameEvents.HERO_MOVE, { x: 50, y: 50 });

			expect(logSpy).toHaveBeenCalledWith(
				`🔍 [Debug] ${GameEvents.HERO_MOVE}:`,
				{ x: 50, y: 50 },
			);
		});

		it("should log multiple debug events", () => {
			const logSpy = vi.spyOn(logger, "debug");
			setupDebugListeners();

			eventBus.emit(GameEvents.DIALOG_OPEN, { dialogId: "test" });
			eventBus.emit(GameEvents.PAUSE, {});

			expect(logSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("setupPerformanceListeners", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should track loading duration", () => {
			const logSpy = vi.spyOn(logger, "info");
			setupPerformanceListeners();

			eventBus.emit(GameEvents.LOADING_START, { source: "testOperation" });
			vi.advanceTimersByTime(500);
			eventBus.emit(GameEvents.LOADING_END, { source: "testOperation" });

			expect(logSpy).toHaveBeenCalledWith(
				"⏱️ [Performance] testOperation took 500ms",
			);
		});

		it("should warn about slow operations", () => {
			const warnSpy = vi.spyOn(logger, "warn");
			setupPerformanceListeners();

			eventBus.emit(GameEvents.LOADING_START, { source: "slowOperation" });
			vi.advanceTimersByTime(1500);
			eventBus.emit(GameEvents.LOADING_END, { source: "slowOperation" });

			expect(warnSpy).toHaveBeenCalledWith(
				"⚠️ [Performance] Slow operation: slowOperation (1500ms)",
			);
		});
	});

	describe("initializeEventListeners", () => {
		it("should initialize all listeners", () => {
			const logSpy = vi.spyOn(logger, "info");

			initializeEventListeners();

			expect(logSpy).toHaveBeenCalledWith("✅ EventBus listeners initialized");
		});

		it("should setup analytics listeners", () => {
			const logSpy = vi.spyOn(logger, "info");
			initializeEventListeners();

			eventBus.emit(GameEvents.QUEST_STARTED, { questId: "test" });

			expect(logSpy).toHaveBeenCalledWith(
				"📊 [Analytics] Quest started:",
				"test",
			);
		});
	});
});
