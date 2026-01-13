/**
 * @typedef {import('../core/game-context.js').IGameContext} IGameContext
 */

/**
 * Setup SessionManager integration
 * @param {IGameContext} context
 */
export function setupSessionManager(context) {
	// Initialize GameSessionManager with quest navigation dependencies
	context.sessionManager.questController = context.questController;
	// Initialize event listeners
	context.sessionManager.setupEventListeners();
}
