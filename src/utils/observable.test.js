import { describe, expect, it, vi } from "vitest";
import { Observable } from "./observable.js";

describe("Observable Utility", () => {
	it("should allow subscribing and unsubscribing", () => {
		const observable = new Observable();
		const listener = vi.fn();

		const unsubscribe = observable.subscribe(listener);
		observable.notify("test");
		expect(listener).toHaveBeenCalledWith("test", undefined);

		unsubscribe();
		observable.notify("test2");
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("should notify multiple listeners", () => {
		const observable = new Observable();
		const listenerA = vi.fn();
		const listenerB = vi.fn();

		observable.subscribe(listenerA);
		observable.subscribe(listenerB);

		observable.notify("update");

		expect(listenerA).toHaveBeenCalledWith("update", undefined);
		expect(listenerB).toHaveBeenCalledWith("update", undefined);
	});

	it("should handle errors in listeners gracefully", () => {
		const observable = new Observable();
		const errorListener = vi.fn(() => {
			throw new Error("Oops");
		});
		const successListener = vi.fn();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		observable.subscribe(errorListener);
		observable.subscribe(successListener);

		observable.notify("test");

		expect(errorListener).toHaveBeenCalled();
		expect(successListener).toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalled();
	});
});
