/**
 * Setup SessionManager integration
 * @param {import('../legacys-end-app.js').LegacysEndApp} app
 */
export function setupSessionManager(app) {
	// Initialize GameSessionManager with quest navigation dependencies
	app.sessionManager.questController = app.questController;
	app.sessionManager.router = app.router;

	// Note: Controller references (keyboard, interaction, collision, zones, voice)
	// are now managed in GameView and will be set when GameView initializes
}
