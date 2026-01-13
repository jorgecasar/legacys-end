/**
 * Voice Command Actions Configuration
 *
 * Declarative mapping of voice commands to their corresponding actions.
 * Separates command logic from the VoiceController for better maintainability.
 */

/**
 * @typedef {import('../controllers/voice-controller.js').VoiceController} VoiceController
 */

/**
 * Execute a voice command action
 * @param {string} action - The action to execute
 * @param {unknown} value - Optional value for the action
 * @param {VoiceController} controller - VoiceController instance with options
 * @param {string|null} [lang] - Language for feedback
 */
export function executeVoiceAction(action, value, controller, lang = null) {
	const { options } = controller;

	// Command action mapping
	/** @type {Object.<string, Function>} */
	const actionHandlers = {
		move_up: () => options.onMove?.(0, -5),
		move_down: () => options.onMove?.(0, 5),
		move_left: () => options.onMove?.(-5, 0),
		move_right: () => options.onMove?.(5, 0),

		move_to_npc: () => options.onMoveToNpc?.(),
		move_to_exit: () => options.onMoveToExit?.(),

		pause: () => options.onPause?.(),

		next_slide: () => options.onNextSlide?.(),
		prev_slide: () => options.onPrevSlide?.(),

		interact: () => {
			options.onInteract?.();
			// After a short delay, narrate the dialogue
			setTimeout(() => {
				const dialogText = options.onGetDialogText?.();
				if (dialogText) {
					controller.narrateDialogue(dialogText, lang);
				}
			}, 400);
		},

		complete_chapter: () => controller.celebrateChapter(),

		help: () => controller.showHelp(),

		debug: () => {
			if (value) {
				options.onDebugAction?.(/** @type {string} */ (action), value);
			}
		},
	};

	// Execute the action if it exists
	const normalizedAction = action.replace(/\s+/g, "_").replace(/_+/g, "_");
	const handler = actionHandlers[normalizedAction] || actionHandlers[action];
	if (handler) {
		handler();
	} else {
		console.warn(`Unknown action: ${action}`);
	}
}
