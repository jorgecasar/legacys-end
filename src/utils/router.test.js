import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "./router.js";

describe("SimpleRouter", () => {
	/** @type {Router} */
	let router;

	beforeEach(() => {
		router = new Router();
		// Mock window.location and history
		// Note: JSDOM supports history api, but modifying window.location directly might be tricky in some environments.
		// For replaceState/pushState we rely on JSDOM implementation.
	});

	afterEach(() => {
		router.dispose();
		vi.restoreAllMocks();
	});

	it("should match static routes", () => {
		const callback = vi.fn();
		router.addRoute("/", callback);
		router.init();

		router.navigate("/");
		expect(callback).toHaveBeenCalledWith({});
	});

	it("should match dynamic routes with params", () => {
		const callback = vi.fn();
		router.addRoute("/quest/:id", callback);
		router.init();

		router.navigate("/quest/123");
		expect(callback).toHaveBeenCalledWith({ id: "123" });
	});

	it("should match multiple dynamic params", () => {
		const callback = vi.fn();
		router.addRoute("/quest/:id/chapter/:chapterId", callback);
		router.init();

		router.navigate("/quest/123/chapter/456");
		expect(callback).toHaveBeenCalledWith({ id: "123", chapterId: "456" });
	});

	it("should match multiple routes in order", () => {
		const rootCallback = vi.fn();
		const hubCallback = vi.fn();
		router.addRoute("/", hubCallback);
		router.addRoute("/", rootCallback); // Should use exact match logic in simple implementation
		router.init();

		router.navigate("/");
		expect(hubCallback).toHaveBeenCalled();
		expect(rootCallback).not.toHaveBeenCalled();
	});

	// Note: Our simple router expects EXACT segment length match, so "/" and "" might behave differently dependent on implementation.
	// _matchPattern splits by "/" so leading "/" makes empty string first element.
	// "/" -> ["", "hub"]
	// "/" -> ["", ""]
});
