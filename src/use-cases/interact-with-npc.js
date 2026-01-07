/**
 * InteractWithNpcUseCase
 *
 * Encapsulates the business rules for interacting with NPCs.
 * Handles victory condition checks and interaction availability.
 */
export class InteractWithNpcUseCase {
	/**
	 * @typedef {Object} InteractParams
	 * @property {boolean} isClose - Whether the hero is close to the NPC
	 * @property {Object} [chapterData] - Current chapter configuration
	 * @property {boolean} [chapterData.isFinalBoss] - Whether this is the final boss npc
	 * @property {string} hotSwitchState - Current API state ('legacy' or 'new')
	 * @property {boolean} hasCollectedItem - Whether the item/reward has already been collected
	 */

	/**
	 * Execute the interaction logic
	 * @param {InteractParams} params
	 * @returns {{success: boolean, action: 'showDialog' | 'showLocked' | 'none', message?: string}}
	 */
	execute({ isClose, chapterData, hotSwitchState, hasCollectedItem }) {
		if (!isClose) {
			return { success: false, action: "none" };
		}

		// Final Boss Victory condition check
		if (chapterData?.isFinalBoss) {
			if (hotSwitchState === "new") {
				return { success: true, action: "showDialog" };
			}
			return {
				success: false,
				action: "showLocked",
				message: "REQ: NEW API",
			};
		}

		// Regular interaction
		if (!hasCollectedItem) {
			return { success: true, action: "showDialog" };
		}

		return { success: false, action: "none" };
	}
}
