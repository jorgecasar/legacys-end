/**
 * @typedef {import("../types/quests.d.js").Quest} Quest
 */

import { getQuests } from "../content/quests/quests-data.js";

/**
 * Gets quests that are unlocked and available to play
 * @returns {Quest[]} Array of available quests
 */
export function getAvailableQuests() {
	return Object.values(getQuests()).filter(
		(quest) => quest.status !== "coming_soon",
	);
}
