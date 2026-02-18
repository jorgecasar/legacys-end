/**
 * @typedef {import("../types/quests.d.js").Quest} Quest
 */

import { getQuests } from "../content/quests/quests-data.js";

/**
 * Get quests that are coming soon
 * @returns {Quest[]} Array of coming soon quests
 */
export function getComingSoonQuests() {
	return Object.values(getQuests()).filter(
		(quest) => quest.status === "coming_soon",
	);
}
