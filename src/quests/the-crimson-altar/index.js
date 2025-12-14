import { QuestType, Difficulty } from '../quest-types.js';
import { THE_SCRYING_POOL_OF_CHAOS_CHAPTERS } from './chapters.js';

export const THE_SCRYING_POOL_OF_CHAOS_QUEST = {
	id: 'the-crimson-altar',
	name: "The Crimson Altar",
	subtitle: 'Transform Error Chaos into Intelligence',
	type: QuestType.QUEST,
	description: 'Achieve Total Monitoring. Channel application chaos to a control point, capturing and reacting to failures without stopping the application.',
	legacyProblem: 'Unhandled errors crash the app, silent failures, lack of visibility into issues.',
	prerequisites: ['the-flowing-heartstone', 'the-mirror-of-veracity'],
	shortcuts: [],
	difficulty: Difficulty.ADVANCED,
	icon: 'eye',
	estimatedTime: '35-45 min',
	concepts: ['Centralized Error Handling', 'Logging', 'Observability Patterns', 'Boundary Error Components'],
	chapterIds: [],
	chapters: THE_SCRYING_POOL_OF_CHAOS_CHAPTERS,
	reward: {
		badge: 'Chaos Warden',
		description: 'Resilient application with full error observability',
		ability: 'Centralized Monitoring'
	},
	status: 'coming-soon'
};
