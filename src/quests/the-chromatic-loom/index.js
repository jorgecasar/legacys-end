
import { QuestType, Difficulty } from '../quest-types.js';
import { THE_CHROMATIC_LOOM_CHAPTERS } from './chapters.js';

/**
 * The Token of Agnosticism Quest Metadata
 * 
 * Teaches Design Tokens and visual adaptation
 */
export const TOKEN_OF_AGNOSTICISM_QUEST = {
	id: 'the-chromatic-loom',
	name: "The Chromatic Loom",
	subtitle: 'Dress Your App in Any Brand and Theme',
	type: QuestType.QUEST,
	description: 'Achieve Visual Adaptation to any theme or brand. Grant your component aesthetic flexibility without breaking encapsulation.',
	legacyProblem: 'Hardcoded styles or components that cannot change themes.',
	prerequisites: ['tunic-of-isolation'],
	shortcuts: [],
	difficulty: Difficulty.INTERMEDIATE,
	icon: 'palette',
	estimatedTime: '20-30 min',
	concepts: ['Design Tokens', 'CSS Custom Properties', 'Programmatic Theming'],

	// Chapter IDs
	chapterIds: ['fortress-of-design'],

	// Chapter data
	chapters: THE_CHROMATIC_LOOM_CHAPTERS,

	reward: {
		badge: 'Visually Agnostic',
		description: 'Visually agnostic and adaptable component',
		ability: 'Visual Adaptation'
	},
	status: 'coming-soon'
};

