import { msg } from "@lit/localize";
import { Difficulty, QuestStatus } from "./quest-types.js";

/**
 * @typedef {import("./quest-types.js").Quest} Quest
 * @typedef {import("./quest-types.js").QuestMetadata} QuestMetadata
 */

/** @returns {QuestMetadata} */
export const getAuraOfSovereigntyMetadata = () => ({
	id: "the-aura-of-sovereignty",
	name: msg("The Aura of Sovereignty"),
	subtitle: msg("Forging the Immutable Component Shield"),
	description: msg(
		"Before Alarion can connect with others, he must learn to exist without being corrupted by them. In the Toxic Swamp of Global Scope, he must find an umbrella to protect his styles and DOM from the chaotic environment. Encapsulate your code.",
	),
	difficulty: Difficulty.BEGINNER,
	estimatedTime: msg("5-10 min"),
	icon: "shield",
	status: QuestStatus.AVAILABLE,
	prerequisites: [],
});

/** @returns {QuestMetadata} */
export const getTokenOfAgnosticismMetadata = () => ({
	id: "the-chromatic-loom",
	name: msg("The Chromatic Loom"),
	subtitle: msg("Weaving the Threads of Agnosticism"),
	description: msg(
		"Alarion visits the Weavers of the Chromatic Loom to learn the art of Agnosticism. He must create components that can accept any thread (color/theme) without being bound to a specific dye. Design Tokens are the key.",
	),
	difficulty: Difficulty.BEGINNER,
	estimatedTime: msg("20-30 min"),
	icon: "palette",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-aura-of-sovereignty"],
});

/** @returns {QuestMetadata} */
export const getOrbOfInquiryMetadata = () => ({
	id: "the-orb-of-inquiry",
	name: msg("The Orb of Inquiry"),
	subtitle: msg("Gazing into the Attribute Abyss"),
	description: msg(
		"To understand the outside world, Alarion must learn to observe without interfering. The Orb of Inquiry reveals how to accept data through Attributes and Properties, reacting to changes like a reflection in water.",
	),
	difficulty: Difficulty.INTERMEDIATE,
	estimatedTime: msg("20-25 min"),
	icon: "syringe",
	status: QuestStatus.AVAILABLE,
	prerequisites: [],
});

/** @returns {QuestMetadata} */
export const getStateManagementRaidMetadata = () => ({
	id: "the-flowing-heartstone",
	name: msg("The Flowing Heartstone"),
	subtitle: msg("Channeling the River of State"),
	description: msg(
		"Deep within the Crystal Caverns lies the Heartstone, pulsing with energy. Alarion must learn to channel this energy (State) downstream to his children, ensuring the flow is unidirectional and controlled. Reactive Data Flow.",
	),
	difficulty: Difficulty.INTERMEDIATE,
	estimatedTime: msg("30-40 min"),
	icon: "hexagon-nodes",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-orb-of-inquiry"],
});

/** @returns {QuestMetadata} */
export const getGateOfIdentityMetadata = () => ({
	id: "the-watchers-bastion",
	name: msg("The Watcher's Bastion"),
	subtitle: msg("Guarding the Events of the Self"),
	description: msg(
		"The Watchers demand proof of identity. Alarion must learn to speak for himself, dispatching Custom Events to notify the world of his actions, without checking who is listening. The principle of 'Fire and Forget'.",
	),
	difficulty: Difficulty.INTERMEDIATE,
	estimatedTime: msg("30-40 min"),
	icon: "radio",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-flowing-heartstone"],
});

/** @returns {QuestMetadata} */
export const getMirrorOfVeracityMetadata = () => ({
	id: "the-mirror-of-veracity",
	name: msg("The Mirror of Veracity"),
	subtitle: msg("Reflecting All Possible States"),
	description: msg(
		"The Mirror shows Alarion not just who he is, but who he could be. He must build a Storybook of his life, documenting every possible state (Loading, Error, Empty, Success) to ensure he is ready for anything.",
	),
	difficulty: Difficulty.ADVANCED,
	estimatedTime: msg("30-40 min"),
	icon: "list-check",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-watchers-bastion"],
});

/** @returns {QuestMetadata} */
export const getScryingPoolOfChaosMetadata = () => ({
	id: "the-crimson-altar",
	name: msg("The Crimson Altar"),
	subtitle: msg("Surviving the Unit Test Trials"),
	description: msg(
		"The Chaos Spirits try to break Alarion. He must forge a suit of Armor (Unit Tests) that can withstand every attack. Only by proving his logic is sound can he survive the Crimson Altar.",
	),
	difficulty: Difficulty.ADVANCED,
	estimatedTime: msg("35-45 min"),
	icon: "flask-vial",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-mirror-of-veracity"],
});

/** @returns {QuestMetadata} */
export const getScrollOfTonguesMetadata = () => ({
	id: "the-scroll-of-tongues",
	name: msg("The Scroll of Tongues"),
	subtitle: msg("Speaking to Every Soul"),
	description: msg(
		"The world is vast, and not everyone speaks the same language. Alarion must decrypt the Scroll of Tongues (i18n) to make his message understood by all, ensuring his legacy reaches every corner of the realm.",
	),
	difficulty: Difficulty.ADVANCED,
	estimatedTime: msg("25-35 min"),
	icon: "language",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-crimson-altar"],
});

/** @returns {QuestMetadata} */
export const getUnseenHarmonyMetadata = () => ({
	id: "the-unseen-harmony",
	name: msg("The Unseen Harmony"),
	subtitle: msg("Navigating with the Mind's Eye"),
	description: msg(
		"Alarion is blinded by the mists of the Unseen. He must learn to navigate using only his other senses (Accessibility/a11y), ensuring that even those who cannot see the path can still follow his journey.",
	),
	difficulty: Difficulty.EXPERT,
	estimatedTime: msg("25-35 min"),
	icon: "eye-low-vision",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-scroll-of-tongues"],
});

/** @returns {QuestMetadata} */
export const getOracleOfSiliconMetadata = () => ({
	id: "the-oracle-of-silicon",
	name: msg("The Oracle of Silicon"),
	subtitle: msg("Optimizing the Essence of Time"),
	description: msg(
		"In the final trial, Alarion faces the Oracle, who judges him on speed and efficiency. He must optimize his performance, reduce his weight (bundle size), and move with the speed of thought. Performance & Best Practices.",
	),
	difficulty: Difficulty.EXPERT,
	estimatedTime: msg("15-20 min"),
	icon: "microchip",
	status: QuestStatus.COMING_SOON,
	prerequisites: ["the-unseen-harmony"],
});

export const getQuestManifest = () => {
	const manifests = [
		getAuraOfSovereigntyMetadata(),
		getTokenOfAgnosticismMetadata(),
		getOrbOfInquiryMetadata(),
		getStateManagementRaidMetadata(),
		getGateOfIdentityMetadata(),
		getMirrorOfVeracityMetadata(),
		getScryingPoolOfChaosMetadata(),
		getScrollOfTonguesMetadata(),
		getUnseenHarmonyMetadata(),
		getOracleOfSiliconMetadata(),
	];

	return manifests.reduce(
		(acc, current) => {
			if (current.id) {
				acc[current.id] = current;
			}
			return acc;
		},
		/** @type {Record<string, QuestMetadata>} */ ({}),
	);
};
