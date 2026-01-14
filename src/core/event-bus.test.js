import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventBus, GameEvents } from "./event-bus.js";

describe("EventBus", () => {
	/** @type {EventBus} */
	let bus;

	beforeEach(() => {
		bus = new EventBus();
		// Clear all listeners and mocks before each test
		bus.clear(); // Assuming eventBus.clear() in the instruction meant bus.clear()
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
	});

	describe("on/emit", () => {
		it("should subscribe and emit events", () => {
			const callback = vi.fn();
			bus.on("test", callback);
			bus.emit("test", { data: "hello" });

			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith({ data: "hello" });
		});

		it("should support multiple listeners", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			bus.on("test", callback1);
			bus.on("test", callback2);
			bus.emit("test", "data");

			expect(callback1).toHaveBeenCalledWith("data");
			expect(callback2).toHaveBeenCalledWith("data");
		});

		it("should not call listeners for different events", () => {
			const callback = vi.fn();
			bus.on("event1", callback);
			bus.emit("event2", "data");

			expect(callback).not.toHaveBeenCalled();
		});

		it("should handle events with no listeners", () => {
			expect(() => bus.emit("nonexistent", "data")).not.toThrow();
		});
	});

	describe("off", () => {
		it("should unsubscribe listener", () => {
			const callback = vi.fn();
			bus.on("test", callback);
			bus.off("test", callback);
			bus.emit("test", "data");

			expect(callback).not.toHaveBeenCalled();
		});

		it("should return unsubscribe function", () => {
			const callback = vi.fn();
			const unsubscribe = bus.on("test", callback);

			unsubscribe();
			bus.emit("test", "data");

			expect(callback).not.toHaveBeenCalled();
		});

		it("should only remove specified callback", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			bus.on("test", callback1);
			bus.on("test", callback2);
			bus.off("test", callback1);
			bus.emit("test", "data");

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalled();
		});
	});

	describe("once", () => {
		it("should only trigger callback once", () => {
			const callback = vi.fn();
			bus.once("test", callback);

			bus.emit("test", "data1");
			bus.emit("test", "data2");

			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith("data1");
		});

		it("should return unsubscribe function", () => {
			const callback = vi.fn();
			const unsubscribe = bus.once("test", callback);

			unsubscribe();
			bus.emit("test", "data");

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe("clear", () => {
		it("should clear all listeners for an event", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			bus.on("test", callback1);
			bus.on("test", callback2);
			bus.clear("test");
			bus.emit("test", "data");

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).not.toHaveBeenCalled();
		});

		it("should clear all events when no event specified", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			bus.on("event1", callback1);
			bus.on("event2", callback2);
			bus.clear();
			bus.emit("event1", "data");
			bus.emit("event2", "data");

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).not.toHaveBeenCalled();
		});
	});

	describe("listenerCount", () => {
		it("should return number of listeners", () => {
			expect(bus.listenerCount("test")).toBe(0);

			bus.on("test", () => {});
			expect(bus.listenerCount("test")).toBe(1);

			bus.on("test", () => {});
			expect(bus.listenerCount("test")).toBe(2);
		});
	});

	describe("eventNames", () => {
		it("should return all event names", () => {
			bus.on("event1", () => {});
			bus.on("event2", () => {});

			const names = bus.eventNames();
			expect(names).toContain("event1");
			expect(names).toContain("event2");
			expect(names).toHaveLength(2);
		});

		it("should return empty array when no events", () => {
			expect(bus.eventNames()).toHaveLength(0);
		});
	});

	describe("error handling", () => {
		it("should catch errors in listeners", () => {
			const errorCallback = vi.fn(() => {
				throw new Error("Test error");
			});
			const normalCallback = vi.fn();

			bus.on("test", errorCallback);
			bus.on("test", normalCallback);

			// Should not throw
			expect(() => bus.emit("test", "data")).not.toThrow();

			// Normal callback should still be called
			expect(normalCallback).toHaveBeenCalled();
		});
	});

	describe("history", () => {
		it("should record event history", () => {
			bus.emit("event1", "data1");
			bus.emit("event2", "data2");

			const history = bus.getHistory();
			expect(history).toHaveLength(2);
			expect(history[0].event).toBe("event1");
			expect(history[0].data).toBe("data1");
			expect(history[1].event).toBe("event2");
		});

		it("should limit history size", () => {
			bus.emit("test", "data");
			const history = bus.getHistory(1);
			expect(history).toHaveLength(1);
		});

		it("should clear history", () => {
			bus.emit("test", "data");
			bus.clearHistory();
			expect(bus.getHistory()).toHaveLength(0);
		});
	});

	describe("GameEvents constants", () => {
		it("should define common event names", () => {
			expect(GameEvents.QUEST_STARTED).toBe("quest:started");
			expect(GameEvents.HERO_MOVE).toBe("hero:move");
			expect(GameEvents.ERROR).toBe("error");
		});
	});
});
