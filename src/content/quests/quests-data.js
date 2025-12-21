import { Difficulty, QuestType } from "./quest-types.js";
import { THE_AURA_OF_SOVEREIGNTY_QUEST } from "./the-aura-of-sovereignty/index.js";
import { TOKEN_OF_AGNOSTICISM_QUEST } from "./the-chromatic-loom/index.js";
import { THE_SCRYING_POOL_OF_CHAOS_QUEST } from "./the-crimson-altar/index.js";
import { STATE_MANAGEMENT_RAID_QUEST } from "./the-flowing-heartstone/index.js";
import { THE_MIRROR_OF_VERACITY_QUEST } from "./the-mirror-of-veracity/index.js";
import { THE_ORB_OF_INQUIRY_QUEST } from "./the-orb-of-inquiry/index.js";
import { THE_SCROLL_OF_TONGUES_QUEST } from "./the-scroll-of-tongues/index.js";
import { GATE_OF_IDENTITY_QUEST } from "./the-watchers-bastion/index.js";

// Re-export types for convenience
export { QuestType, Difficulty };

/**
 * Quest Data Registry
 *
 * Central definition of all quest data.
 * This file contains ONLY data, no business logic.
 * For quest-related logic, see quest-registry-service.js
 */

/**
 * Quest Registry
 * Maps quest IDs to quest definitions
 */
export const QUESTS = {
	[THE_AURA_OF_SOVEREIGNTY_QUEST.id]: THE_AURA_OF_SOVEREIGNTY_QUEST,
	[TOKEN_OF_AGNOSTICISM_QUEST.id]: TOKEN_OF_AGNOSTICISM_QUEST,
	[THE_ORB_OF_INQUIRY_QUEST.id]: THE_ORB_OF_INQUIRY_QUEST,
	[STATE_MANAGEMENT_RAID_QUEST.id]: STATE_MANAGEMENT_RAID_QUEST,
	[GATE_OF_IDENTITY_QUEST.id]: GATE_OF_IDENTITY_QUEST,
	[THE_MIRROR_OF_VERACITY_QUEST.id]: THE_MIRROR_OF_VERACITY_QUEST,
	[THE_SCRYING_POOL_OF_CHAOS_QUEST.id]: THE_SCRYING_POOL_OF_CHAOS_QUEST,
	[THE_SCROLL_OF_TONGUES_QUEST.id]: THE_SCROLL_OF_TONGUES_QUEST,
};
