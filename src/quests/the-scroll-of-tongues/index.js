import { QuestType, Difficulty } from '../quest-types.js';
import { THE_SCROLL_OF_TONGUES_CHAPTERS } from './chapters.js';

export const THE_SCROLL_OF_TONGUES_QUEST = {
	id: 'the-scroll-of-tongues',
	name: "The Scroll of Tongues",
	subtitle: 'Unlock Your App for Every Language and Market',
	type: QuestType.QUEST,
	description: 'Unlock Global Territories. Translate and adapt components to any language and culture, achieving Total Globalization.',
	legacyProblem: 'Hardcoded strings, date/number format issues across regions, lack of localization.',
	prerequisites: ['the-crimson-altar'],
	shortcuts: [],
	difficulty: Difficulty.INTERMEDIATE,
	icon: 'globe',
	estimatedTime: '25-35 min',
	concepts: ['i18n Context', 'Locale Management', 'Contextual Formatting', 'String Management'],
	chapterIds: [],
	chapters: THE_SCROLL_OF_TONGUES_CHAPTERS,
	reward: {
		badge: 'Polyglot Master',
		description: 'Globally accessible component, adapted to any culture',
		ability: 'Total Globalization'
	},
	status: 'coming-soon'
};
