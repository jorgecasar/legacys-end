/**
 * Quest Loader Registry
 * Maps quest IDs to dynamic import functions
 */
const QUEST_LOADERS = {
	"the-aura-of-sovereignty": () =>
		import("./the-aura-of-sovereignty/index.js").then(
			(m) => m.THE_AURA_OF_SOVEREIGNTY_QUEST,
		),
	"the-chromatic-loom": () =>
		import("./the-chromatic-loom/index.js").then(
			(m) => m.TOKEN_OF_AGNOSTICISM_QUEST,
		),
	"the-orb-of-inquiry": () =>
		import("./the-orb-of-inquiry/index.js").then(
			(m) => m.THE_ORB_OF_INQUIRY_QUEST,
		),
	"the-flowing-heartstone": () =>
		import("./the-flowing-heartstone/index.js").then(
			(m) => m.STATE_MANAGEMENT_RAID_QUEST,
		),
	"the-watchers-bastion": () =>
		import("./the-watchers-bastion/index.js").then(
			(m) => m.GATE_OF_IDENTITY_QUEST,
		),
	"the-mirror-of-veracity": () =>
		import("./the-mirror-of-veracity/index.js").then(
			(m) => m.THE_MIRROR_OF_VERACITY_QUEST,
		),
	"the-crimson-altar": () =>
		import("./the-crimson-altar/index.js").then(
			(m) => m.THE_SCRYING_POOL_OF_CHAOS_QUEST,
		),
	"the-scroll-of-tongues": () =>
		import("./the-scroll-of-tongues/index.js").then(
			(m) => m.THE_SCROLL_OF_TONGUES_QUEST,
		),
	"the-unseen-harmony": () =>
		import("./the-unseen-harmony/index.js").then(
			(m) => m.THE_UNSEEN_HARMONY_QUEST,
		),
	"the-oracle-of-silicon": () =>
		import("./the-oracle-of-silicon/index.js").then(
			(m) => m.THE_ORACLE_OF_SILICON_QUEST,
		),
};

/**
 * Load full quest data (including chapters) dynamically
 * @param {string} questId
 * @returns {Promise<import("./quest-types.js").Quest | undefined>}
 */
export async function loadQuest(questId) {
	const loader =
		/** @type {Record<string, () => Promise<import("./quest-types.js").Quest>>} */ (
			QUEST_LOADERS
		)[questId];
	if (!loader) {
		console.warn(`No loader found for quest: ${questId}`);
		return undefined;
	}
	try {
		return await loader();
	} catch (error) {
		console.error(`Failed to load quest ${questId}:`, error);
		return undefined;
	}
}

// Re-export QUESTS from manifest for backward compatibility or direct metadata access
// But consumers should prefer quest-registry-service.js
export { QUEST_MANIFEST as QUESTS } from "./quest-manifest.js";
