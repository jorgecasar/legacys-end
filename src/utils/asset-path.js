/**
 * Get the correct asset path for the current environment.
 * In development, returns the path as-is.
 * In production (GitHub Pages), prepends the base URL.
 * 
 * @param {string} path - The asset path (e.g., "/assets/image.png")
 * @returns {string} The correct asset path for the current environment
 */
export function getAssetPath(path) {
	const baseUrl = import.meta.env.BASE_URL;

	// If path already starts with the base URL, return it as-is
	if (path.startsWith(baseUrl)) {
		return path;
	}

	// Remove leading slash if present
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;

	// Prepend the base URL
	return `${baseUrl}${cleanPath}`;
}
