// Service Worker for GitHub Pages caching
// Solves Lighthouse "efficient cache policy" warning

const CACHE_NAME = "legacys-end-v1";
const RUNTIME_CACHE = "legacys-end-runtime";

// Assets to cache immediately on install
const PRECACHE_ASSETS = ["/legacys-end/", "/legacys-end/index.html"];

// Install event - precache critical assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_ASSETS))
			.then(() => self.skipWaiting()),
	);
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
						.map((name) => caches.delete(name)),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// Fetch event - cache strategy
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== "GET") return;

	// Skip cross-origin requests (except fonts)
	if (url.origin !== location.origin && !url.href.includes("fonts")) {
		return;
	}

	// Cache strategy based on resource type
	if (isStaticAsset(url)) {
		// Cache-first for static assets (JS, CSS, images, fonts)
		event.respondWith(cacheFirst(request));
	} else {
		// Network-first for HTML and API calls
		event.respondWith(networkFirst(request));
	}
});

// Cache-first strategy: Check cache, fallback to network
async function cacheFirst(request) {
	const cache = await caches.open(RUNTIME_CACHE);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		// Cache successful responses
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		console.error("Fetch failed:", error);
		throw error;
	}
}

// Network-first strategy: Try network, fallback to cache
async function networkFirst(request) {
	const cache = await caches.open(RUNTIME_CACHE);

	try {
		const response = await fetch(request);
		// Cache successful responses
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}
		throw error;
	}
}

// Check if URL is a static asset
function isStaticAsset(url) {
	const staticExtensions = [
		".js",
		".css",
		".webp",
		".png",
		".jpg",
		".jpeg",
		".svg",
		".woff",
		".woff2",
		".ttf",
	];
	return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}
