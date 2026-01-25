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
 * @param {VoiceController} controller - VoiceController instance with options
 * @param {string|null} [lang] - Language for feedback
 */
export function executeVoiceAction(action, controller, lang = null) {
	// Command action mapping
	/** @type {Record<string, () => void>} */
	const actionHandlers = {
		move_up: () => controller.move(0, -5),
		move_down: () => controller.move(0, 5),
		move_left: () => controller.move(-5, 0),
		move_right: () => controller.move(5, 0),

		move_to_npc: () => controller.moveToNpc(),
		move_to_exit: () => controller.moveToExit(),

		pause: () => controller.pause(),

		next_slide: () => controller.nextSlide(),
		prev_slide: () => controller.prevSlide(),

		interact: () => {
			controller.interact();
			// After a short delay, narrate the dialogue
			setTimeout(() => {
				const dialogText = controller._dialogContext?.currentDialogText;
				if (dialogText) {
					controller.narrateDialogue(dialogText, lang);
				}
			}, 400);
		},

		complete_chapter: () => controller.celebrateChapter(),

		help: () => controller.showHelp(),

		debug: () => {
			// Deprecated debug action
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
