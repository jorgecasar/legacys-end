/**
 * @typedef {import("./quest-types.js").Quest} Quest
 * @typedef {import("./quest-types.js").Difficulty} Difficulty
 */

export const THE_AURA_OF_SOVEREIGNTY_METADATA = {
	id: "the-aura-of-sovereignty",
	name: "The Aura of Sovereignty",
	subtitle: "Forging the Immutable Component Shield",
	description:
		"Before Alarion can connect with others, he must learn to exist without being corrupted by them. In the Toxic Swamp of Global Scope, he must find an umbrella to protect his styles and DOM from the chaotic environment. Encapsulate your code.",
	difficulty: "beginner",
	icon: "shield",
	status: "available",
	prerequisites: [],
};

export const TOKEN_OF_AGNOSTICISM_METADATA = {
	id: "the-chromatic-loom",
	name: "The Chromatic Loom",
	subtitle: "Weaving the Threads of Agnosticism",
	description:
		"Alarion visits the Weavers of the Chromatic Loom to learn the art of Agnosticism. He must create components that can accept any thread (color/theme) without being bound to a specific dye. Design Tokens are the key.",
	difficulty: "beginner",
	icon: "palette",
	status: "coming-soon",
	prerequisites: ["the-aura-of-sovereignty"],
};

export const THE_ORB_OF_INQUIRY_METADATA = {
	id: "the-orb-of-inquiry",
	name: "The Orb of Inquiry",
	subtitle: "Gazing into the Attribute Abyss",
	description:
		"To understand the outside world, Alarion must learn to observe without interfering. The Orb of Inquiry reveals how to accept data through Attributes and Properties, reacting to changes like a reflection in water.",
	difficulty: "intermediate",
	icon: "syringe",
	status: "available",
	prerequisites: [],
};

export const STATE_MANAGEMENT_RAID_METADATA = {
	id: "the-flowing-heartstone",
	name: "The Flowing Heartstone",
	subtitle: "Channeling the River of State",
	description:
		"Deep within the Crystal Caverns lies the Heartstone, pulsing with energy. Alarion must learn to channel this energy (State) downstream to his children, ensuring the flow is unidirectional and controlled. Reactive Data Flow.",
	difficulty: "intermediate",
	icon: "hexagon-nodes",
	status: "coming-soon",
	prerequisites: ["the-orb-of-inquiry"],
};

export const GATE_OF_IDENTITY_METADATA = {
	id: "the-watchers-bastion",
	name: "The Watcher's Bastion",
	subtitle: "Guarding the Events of the Self",
	description:
		"The Watchers demand proof of identity. Alarion must learn to speak for himself, dispatching Custom Events to notify the world of his actions, without checking who is listening. The principle of 'Fire and Forget'.",
	difficulty: "intermediate",
	icon: "radio",
	status: "coming-soon",
	prerequisites: ["the-flowing-heartstone"],
};

export const THE_MIRROR_OF_VERACITY_METADATA = {
	id: "the-mirror-of-veracity",
	name: "The Mirror of Veracity",
	subtitle: "Reflecting All Possible States",
	description:
		"The Mirror shows Alarion not just who he is, but who he could be. He must build a Storybook of his life, documenting every possible state (Loading, Error, Empty, Success) to ensure he is ready for anything.",
	difficulty: "advanced",
	icon: "list-check",
	status: "coming-soon",
	prerequisites: ["the-watchers-bastion"],
};

export const THE_SCRYING_POOL_OF_CHAOS_METADATA = {
	id: "the-crimson-altar",
	name: "The Crimson Altar",
	subtitle: "Surviving the Unit Test Trials",
	description:
		"The Chaos Spirits try to break Alarion. He must forge a suit of Armor (Unit Tests) that can withstand every attack. Only by proving his logic is sound can he survive the Crimson Altar.",
	difficulty: "advanced",
	icon: "flask-vial",
	status: "coming-soon",
	prerequisites: ["the-mirror-of-veracity"],
};

export const THE_SCROLL_OF_TONGUES_METADATA = {
	id: "the-scroll-of-tongues",
	name: "The Scroll of Tongues",
	subtitle: "Speaking to Every Soul",
	description:
		"The world is vast, and not everyone speaks the same language. Alarion must decrypt the Scroll of Tongues (i18n) to make his message understood by all, ensuring his legacy reaches every corner of the realm.",
	difficulty: "advanced",
	icon: "language",
	status: "coming-soon",
	prerequisites: ["the-crimson-altar"],
};

export const THE_UNSEEN_HARMONY_METADATA = {
	id: "the-unseen-harmony",
	name: "The Unseen Harmony",
	subtitle: "Navigating with the Mind's Eye",
	description:
		"Alarion is blinded by the mists of the Unseen. He must learn to navigate using only his other senses (Accessibility/a11y), ensuring that even those who cannot see the path can still follow his journey.",
	difficulty: "expert",
	icon: "eye-low-vision",
	status: "coming-soon",
	prerequisites: ["the-scroll-of-tongues"],
};

export const THE_ORACLE_OF_SILICON_METADATA = {
	id: "the-oracle-of-silicon",
	name: "The Oracle of Silicon",
	subtitle: "Optimizing the Essence of Time",
	description:
		"In the final trial, Alarion faces the Oracle, who judges him on speed and efficiency. He must optimize his performance, reduce his weight (bundle size), and move with the speed of thought. Performance & Best Practices.",
	difficulty: "expert",
	icon: "microchip",
	status: "coming-soon",
	prerequisites: ["the-unseen-harmony"],
};

export const QUEST_MANIFEST = {
	[THE_AURA_OF_SOVEREIGNTY_METADATA.id]: THE_AURA_OF_SOVEREIGNTY_METADATA,
	[TOKEN_OF_AGNOSTICISM_METADATA.id]: TOKEN_OF_AGNOSTICISM_METADATA,
	[THE_ORB_OF_INQUIRY_METADATA.id]: THE_ORB_OF_INQUIRY_METADATA,
	[STATE_MANAGEMENT_RAID_METADATA.id]: STATE_MANAGEMENT_RAID_METADATA,
	[GATE_OF_IDENTITY_METADATA.id]: GATE_OF_IDENTITY_METADATA,
	[THE_MIRROR_OF_VERACITY_METADATA.id]: THE_MIRROR_OF_VERACITY_METADATA,
	[THE_SCRYING_POOL_OF_CHAOS_METADATA.id]: THE_SCRYING_POOL_OF_CHAOS_METADATA,
	[THE_SCROLL_OF_TONGUES_METADATA.id]: THE_SCROLL_OF_TONGUES_METADATA,
	[THE_UNSEEN_HARMONY_METADATA.id]: THE_UNSEEN_HARMONY_METADATA,
	[THE_ORACLE_OF_SILICON_METADATA.id]: THE_ORACLE_OF_SILICON_METADATA,
};
