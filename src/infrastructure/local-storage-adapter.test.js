import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageAdapter } from "../infrastructure/local-storage-adapter.js";

describe("LocalStorageAdapter", () => {
	/** @type {LocalStorageAdapter} */
	let adapter;

	beforeEach(() => {
		vi.resetAllMocks();
		adapter = new LocalStorageAdapter();
		localStorage.clear();
		// Restore any spy
		vi.restoreAllMocks();
	});

	describe("Standard Operations", () => {
		it("should set and get items", () => {
			const data = { foo: "bar" };
			adapter.setItem("key1", data);
			expect(localStorage.getItem("key1")).toBe(JSON.stringify(data));
			expect(adapter.getItem("key1")).toEqual(data);
		});

		it("should return null for non-existent items", () => {
			expect(adapter.getItem("missing")).toBeNull();
		});

		it("should remove items", () => {
			localStorage.setItem("key2", JSON.stringify("value"));
			adapter.removeItem("key2");
			expect(localStorage.getItem("key2")).toBeNull();
		});

		it("should clear storage", () => {
			localStorage.setItem("k1", "v1");
			localStorage.setItem("k2", "v2");
			adapter.clear();
			expect(localStorage.length).toBe(0);
		});
	});

	describe("Error Handling", () => {
		it("should handle setItem errors (e.g. QuotaExceeded)", () => {
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw new Error("QuotaExceeded");
			});

			adapter.setItem("fail", "data");
		});

		it("should handle getItem errors (e.g. JSON parse error)", () => {
			// Manually corrupt data in storage (bypass adapter)
			localStorage.setItem("badJson", "{ invalid: json");

			const result = adapter.getItem("badJson");
			expect(result).toBeNull(); // Should catch error
			// Note: getItem catches JSON.parse error inside try/catch block
		});

		it("should handle getItem access errors", () => {
			vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
				throw new Error("AccessDenied");
			});

			const result = adapter.getItem("key");
			expect(result).toBeNull();
		});

		it("should handle removeItem errors", () => {
			vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
				throw new Error("AccessDenied");
			});

			adapter.removeItem("key");
		});

		it("should handle clear errors", () => {
			vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {
				throw new Error("AccessDenied");
			});

			adapter.clear();
		});
	});
});
