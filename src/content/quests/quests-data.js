/**
 * Quest Loader Registry
 * Maps quest IDs to dynamic import functions
 */
const QUEST_LOADERS = {
	"the-aura-of-sovereignty": () =>
		import("./the-aura-of-sovereignty/index.js").then((m) =>
			m.getAuraOfSovereigntyQuest(),
		),
	"the-chromatic-loom": () =>
		import("./the-chromatic-loom/index.js").then((m) =>
			m.getChromaticLoomQuest(),
		),
	"the-orb-of-inquiry": () =>
		import("./the-orb-of-inquiry/index.js").then((m) =>
			m.getOrbOfInquiryQuest(),
		),
	"the-flowing-heartstone": () =>
		import("./the-flowing-heartstone/index.js").then((m) =>
			m.getStateManagementRaidQuest(),
		),
	"the-watchers-bastion": () =>
		import("./the-watchers-bastion/index.js").then((m) =>
			m.getGateOfIdentityQuest(),
		),
	"the-mirror-of-veracity": () =>
		import("./the-mirror-of-veracity/index.js").then((m) =>
			m.getMirrorOfVeracityQuest(),
		),
	"the-crimson-altar": () =>
		import("./the-crimson-altar/index.js").then((m) =>
			m.getScryingPoolOfChaosQuest(),
		),
	"the-scroll-of-tongues": () =>
		import("./the-scroll-of-tongues/index.js").then((m) =>
			m.getScrollOfTonguesQuest(),
		),
	"the-unseen-harmony": () =>
		import("./the-unseen-harmony/index.js").then((m) =>
			m.getUnseenHarmonyQuest(),
		),
	"the-oracle-of-silicon": () =>
		import("./the-oracle-of-silicon/index.js").then((m) =>
			m.getOracleOfSiliconQuest(),
		),
	"the-zero-one": () =>
		import("./the-zero-one/index.js").then((m) => m.getZeroOneQuest()),
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
		throw new Error(`No loader found for quest: ${questId}`);
	}
	return await loader();
}

// Re-export QUESTS from manifest for backward compatibility or direct metadata access
// But consumers should prefer quest-registry-service.js
import { getQuestManifest } from "./quest-manifest.js";
export const getQuests = getQuestManifest;
/** @deprecated Use getQuests() instead */
export const QUESTS = getQuestManifest;
