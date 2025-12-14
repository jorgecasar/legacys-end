import { QuestType, Difficulty } from '../quest-types.js';
import { THE_ORB_OF_INQUIRY_CHAPTERS } from './chapters.js';

export const THE_ORB_OF_INQUIRY_QUEST = {
	id: 'the-orb-of-inquiry',
	name: "The Orb of Inquiry",
	subtitle: 'Decouple Services for Testable Code',
	type: QuestType.QUEST,
	description: 'Break service coupling and achieve logical independence. Master Dependency Inversion Principle (DIP), Inversion of Control (IoC), and Context API. Culminates with a Hot Switch (live service swap).',
	legacyProblem: 'Direct dependency on fetch or global variables (window.service).',
	prerequisites: ['the-aura-of-sovereignty'],
	shortcuts: [],
	difficulty: Difficulty.INTERMEDIATE,
	icon: 'plug',
	estimatedTime: '20-25 min',
	concepts: ['DIP', 'IoC', 'Service Interfaces', 'Context API', '@provide', '@consume', 'Hot Switch'],
	chapterIds: ['hall-of-definition', 'temple-of-inversion', 'the-jewelers-workshop', 'assay-chamber', 'liberated-battlefield'],
	chapters: THE_ORB_OF_INQUIRY_CHAPTERS,
	reward: {
		badge: 'Backend Agnostic',
		description: '100% backend-agnostic and testable component',
		ability: 'Logical Independence'
	},
	status: 'available'
};
