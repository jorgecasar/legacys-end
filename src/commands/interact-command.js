/**
 * InteractCommand
 *
 * Command to trigger interaction with NPCs or objects.
 * Wraps InteractionController.handleInteract().
 */
export class InteractCommand {
	/**
	 * @param {Object} params
	 * @param {import('../controllers/interaction-controller.js').InteractionController} params.interactionController
	 */
	constructor({ interactionController }) {
		this.interactionController = interactionController;
		this.name = "Interact";
		this.metadata = {};
	}

	/**
	 * Execute the command
	 */
	execute() {
		this.interactionController.handleInteract();
		return { success: true };
	}

	/**
	 * Interaction commands typically don't support undo in this context
	 * as they trigger dialogs or state changes that are handled elsewhere.
	 */
}
