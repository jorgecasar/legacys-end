import { QuestType, Difficulty } from './quest-types.js';
import { THE_AURA_OF_SOVEREIGNTY_QUEST } from './the-aura-of-sovereignty/index.js';
import { TOKEN_OF_AGNOSTICISM_QUEST } from './the-chromatic-loom/index.js';
import { THE_ORB_OF_INQUIRY_QUEST } from './the-orb-of-inquiry/index.js';
import { STATE_MANAGEMENT_RAID_QUEST } from './the-flowing-heartstone/index.js';
import { GATE_OF_IDENTITY_QUEST } from './the-watchers-bastion/index.js';
import { THE_MIRROR_OF_VERACITY_QUEST } from './the-mirror-of-veracity/index.js';
import { THE_SCRYING_POOL_OF_CHAOS_QUEST } from './the-crimson-altar/index.js';
import { THE_SCROLL_OF_TONGUES_QUEST } from './the-scroll-of-tongues/index.js';

// Re-export for backward compatibility
export { QuestType, Difficulty };

/**
 * Quest Registry - Central definition of all quests
 * 
 * Each quest represents a learning path/adventure
 * Quests contain chapters (equivalent to current levels)
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
	[THE_SCROLL_OF_TONGUES_QUEST.id]: THE_SCROLL_OF_TONGUES_QUEST
};

/**
 * Get quest by ID
 */
export function getQuest(questId) {
	return QUESTS[questId];
}

/**
 * Get all quests of a specific type
 */
export function getQuestsByType(type) {
	return Object.values(QUESTS).filter(q => q.type === type);
}

/**
 * Get all available quests (excluding hub)
 */
export function getAllQuests() {
	return getQuestsByType(QuestType.QUEST);
}

/**
 * Check if a quest is locked based on prerequisites
 */
export function isQuestLocked(questId, completedQuests = []) {
	const quest = getQuest(questId);
	if (!quest || quest.type === QuestType.HUB) return false;

	return quest.prerequisites.some(prereq => !completedQuests.includes(prereq));
}

/**
 * Get quests that are unlocked and available to play
 */
export function getAvailableQuests(completedQuests = []) {
	return getAllQuests().filter(quest =>
		quest.status !== 'coming-soon'
	);
}

/**
 * Get quests that are coming soon
 */
export function getComingSoonQuests() {
	return getAllQuests().filter(quest => quest.status === 'coming-soon');
}
