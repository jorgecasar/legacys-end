import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "./router.js";

describe("SimpleRouter", () => {
	/** @type {Router} */
	let router;

	beforeEach(() => {
		// Reset mocks
		vi.resetAllMocks();

		// Reset URL to root (JSDOM native)
		window.history.replaceState(null, "", "/");

		// Mock env default
		vi.stubEnv("BASE_URL", "/");

		// Restore console.warn
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		if (router) router.dispose();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	describe("Initialization", () => {
		it("should handle base path from env", () => {
			vi.stubEnv("BASE_URL", "/app/");
			router = new Router();
			expect(router.basePath).toBe("/app");
		});

		it("should strip base path from initial location", () => {
			vi.stubEnv("BASE_URL", "/app/");
			window.history.pushState(null, "", "/app/dashboard");

			router = new Router();
			const callback = vi.fn();
			router.addRoute("/dashboard", callback);
			router.init();

			expect(router.currentPath).toBe("/dashboard");
			expect(callback).toHaveBeenCalled();
		});

		it("should default to / if base path stripping results in empty string", () => {
			vi.stubEnv("BASE_URL", "/app/");
			window.history.pushState(null, "", "/app");

			router = new Router();
			router.init();

			expect(router.currentPath).toBe("/");
		});
	});

	describe("Matching Logic", () => {
		beforeEach(() => {
			router = new Router();
			// Note: We do NOT init here, to allow tests to setup routes first
		});

		it("should match static routes on init", () => {
			const callback = vi.fn();
			router.addRoute("/", callback);

			router.init();
			expect(callback).toHaveBeenCalledWith({});
		});

		it("should match dynamic routes with params", () => {
			const callback = vi.fn();
			router.addRoute("/quest/:id", callback);

			// Setup history before init
			window.history.pushState(null, "", "/quest/123");
			router.init();

			expect(callback).toHaveBeenCalledWith({ id: "123" });
		});

		it("should match multiple dynamic params", () => {
			const callback = vi.fn();
			router.addRoute("/quest/:id/chapter/:chapterId", callback);

			window.history.pushState(null, "", "/quest/123/chapter/456");
			router.init();

			expect(callback).toHaveBeenCalledWith({ id: "123", chapterId: "456" });
		});

		it("should match multiple routes in order", () => {
			const rootCallback = vi.fn();
			const hubCallback = vi.fn();
			router.addRoute("/", hubCallback);
			router.addRoute("/", rootCallback);

			router.init(); // Matches /

			expect(hubCallback).toHaveBeenCalled();
			expect(rootCallback).not.toHaveBeenCalled();
		});

		it("should warn when no route matches (via navigate)", () => {
			router.init();
			router.navigate("/unknown");
			expect(console.warn).toHaveBeenCalledWith(
				"No route matched for: /unknown",
			);
		});

		it("should fail match if segment counts differ", () => {
			const callback = vi.fn();
			router.addRoute("/a/b", callback);
			router.init();

			router.navigate("/a");
			expect(callback).not.toHaveBeenCalled();
		});

		it("should fail match if literal segments differ", () => {
			const callback = vi.fn();
			router.addRoute("/a/b", callback);
			router.init();

			router.navigate("/a/c");
			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe("Navigation", () => {
		beforeEach(() => {
			router = new Router();
			router.init();
		});

		it("should no-op if navigating to current path", () => {
			router.navigate("/", false);

			const pushSpy = vi.spyOn(window.history, "pushState");
			router.navigate("/", false);
			expect(pushSpy).not.toHaveBeenCalled();
		});

		it("should include query params in current path check", () => {
			router.navigate("/?q=1");
			expect(window.location.search).toBe("?q=1");
		});

		it("should use replaceState when requested", () => {
			const replaceSpy = vi.spyOn(window.history, "replaceState");
			router.navigate("/new", true);
			expect(replaceSpy).toHaveBeenCalledWith(null, "", "/new");
		});

		it("should handle custom base path in navigation", () => {
			router.dispose();
			vi.stubEnv("BASE_URL", "/app/");
			window.history.pushState(null, "", "/app/");

			router = new Router();
			router.init();

			const pushSpy = vi.spyOn(window.history, "pushState");
			router.navigate("/page");

			// Note: Router prepends basePath to navigate arg
			expect(pushSpy).toHaveBeenCalledWith(null, "", "/app/page");
		});
	});
});
