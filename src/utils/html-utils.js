/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} html - The HTML to escape
 * @returns {string} The escaped HTML
 */
export function escapeHtml(html) {
	const placeholderElement = document.createElement("div");
	const textNode = document.createTextNode(html);
	placeholderElement.appendChild(textNode);
	return placeholderElement.innerHTML;
}
