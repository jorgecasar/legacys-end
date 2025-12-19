/**
 * SimpleRouter - Lightweight client-side router
 */
export class Router {
	constructor() {
		this.routes = [];
		this.currentPath = "";
		this._onPopState = this._onPopState.bind(this);
		// Get base path from Vite's import.meta.env.BASE_URL
		this.basePath = import.meta.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
	}

	/**
	 * Initialize router and listen to history changes
	 */
	init() {
		window.addEventListener("popstate", this._onPopState);
		// Handle initial URL
		this._onPopState();
	}

	/**
	 * Cleanup listeners
	 */
	dispose() {
		window.removeEventListener("popstate", this._onPopState);
	}

	/**
	 * Add a route definition
	 * @param {string} pattern - Route pattern (e.g. '/quest/:id' or '/hub')
	 * @param {Function} callback - Callback function(params)
	 */
	addRoute(pattern, callback) {
		this.routes.push({ pattern, callback });
	}

	/**
	 * Navigate to a path
	 * @param {string} path - URL path to navigate to (without base path)
	 * @param {boolean} [replace=false] - Replace current history entry
	 */
	navigate(path, replace = false) {
		// Add base path to the path
		const fullPath = this.basePath + path;

		if (fullPath === window.location.pathname) return;

		if (replace) {
			window.history.replaceState(null, "", fullPath);
		} else {
			window.history.pushState(null, "", fullPath);
		}
		this._onPopState();
	}

	_onPopState() {
		// Remove base path from current pathname for routing
		let path = window.location.pathname;
		if (this.basePath && path.startsWith(this.basePath)) {
			path = path.slice(this.basePath.length) || '/';
		}
		this.currentPath = path;
		this._matchRoute(path);
	}

	_matchRoute(path) {
		for (const route of this.routes) {
			const params = this._matchPattern(route.pattern, path);
			if (params) {
				route.callback(params);
				return;
			}
		}
		console.warn(`No route matched for: ${path}`);
	}

	_matchPattern(pattern, path) {
		const patternParts = pattern.split("/");
		const pathParts = path.split("/");

		if (patternParts.length !== pathParts.length) return null;

		const params = {};
		for (let i = 0; i < patternParts.length; i++) {
			const patternPart = patternParts[i];
			const pathPart = pathParts[i];

			if (patternPart.startsWith(":")) {
				const paramName = patternPart.slice(1);
				params[paramName] = pathPart;
			} else if (patternPart !== pathPart) {
				return null;
			}
		}
		return params;
	}
}
