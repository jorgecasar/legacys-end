import { QuestType, Difficulty } from '../quest-types.js';
import { STATE_MANAGEMENT_RAID_CHAPTERS } from './chapters.js';

export const STATE_MANAGEMENT_RAID_QUEST = {
	id: 'the-flowing-heartstone',
	name: "The Flowing Heartstone",
	subtitle: 'Establish a Single Reactive Source of Truth',
	type: QuestType.QUEST,
	description: 'Conquer Global State Chaos and achieve data predictability. Eliminate prop drilling and unpredictable state mutation with reactive patterns (Signals, Observable Stores).',
	legacyProblem: 'Prop drilling, unpredictable global state mutation, non-reactive state.',
	prerequisites: ['the-orb-of-inquiry'],
	shortcuts: [],
	difficulty: Difficulty.ADVANCED,
	icon: 'database',
	estimatedTime: '30-40 min',
	concepts: ['Reactive Patterns', 'Signals', 'Observable Stores', 'Context API (for Stores)', 'Unidirectional Data Flow'],
	chapterIds: [],
	chapters: STATE_MANAGEMENT_RAID_CHAPTERS,
	reward: {
		badge: 'State Master',
		description: 'Reactive, predictable component without prop drilling',
		ability: 'State Predictability'
	},
	status: 'coming-soon'
};
