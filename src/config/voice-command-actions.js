/**
 * Voice Command Actions Configuration
 *
 * Declarative mapping of voice commands to their corresponding actions.
 * Separates command logic from the VoiceController for better maintainability.
 */

/**
 * Execute a voice command action
 * @param {string} action - The action to execute
 * @param {any} value - Optional value for the action
 * @param {Object} controller - VoiceController instance with options
 * @param {string} [lang] - Language for feedback
 */
export function executeVoiceAction(action, value, controller, lang = null) {
	const { options } = controller;

	// Command action mapping
	const actionHandlers = {
		move_up: () => options.onMove(0, -5),
		move_down: () => options.onMove(0, 5),
		move_left: () => options.onMove(-5, 0),
		move_right: () => options.onMove(5, 0),

		move_to_npc: () => options.onMoveToNpc(),
		move_to_exit: () => options.onMoveToExit(),

		pause: () => options.onPause(),

		next_slide: () => options.onNextSlide(),
		prev_slide: () => options.onPrevSlide(),

		interact: () => {
			options.onInteract();
			// After a short delay, narrate the dialogue
			setTimeout(() => {
				const dialogText = options.onGetDialogText();
				if (dialogText) {
					controller.narrateDialogue(dialogText, lang);
				}
			}, 400);
		},

		complete_chapter: () => controller.celebrateChapter(),

		help: () => controller.showHelp(),

		debug: () => {
			if (value) {
				options.onDebugAction(action, value);
			}
		},
	};

	// Execute the action if it exists
	const handler = actionHandlers[action];
	if (handler) {
		handler();
	} else {
		console.warn(`Unknown action: ${action}`);
	}
}
