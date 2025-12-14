import { QuestType, Difficulty } from '../quest-types.js';
import { GATE_OF_IDENTITY_CHAPTERS } from './chapters.js';

export const GATE_OF_IDENTITY_QUEST = {
	id: 'the-watchers-bastion',
	name: "The Watcher's Bastion",
	subtitle: 'Centralize Security: The Route Guardian',
	type: QuestType.QUEST,
	description: "Alarion's mission to centralize fragmented security logic, establish robust Auth Guards, and achieve a reactive, perimeter-wide user identity. Eliminate scattered `isLoggedIn()` checks and prevent redirect vulnerabilities through a unified security protocol.",
	legacyProblem: 'Scattered authentication logic, repetitive `isLoggedIn()` checks across components, and vulnerable redirection flows.',
	prerequisites: ['the-orb-of-inquiry'],
	shortcuts: [],
	difficulty: Difficulty.ADVANCED,
	icon: 'shield',
	color: '#ef4444',
	estimatedTime: '30-40 min',
	levels: '4-5 levels',
	concepts: ['Auth Guards', 'User Context', 'Centralized Session Management', 'Frontend Perimeter Security', 'Route Protection'],
	chapterIds: [],
	chapters: GATE_OF_IDENTITY_CHAPTERS,
	reward: {
		badge: 'Security Sentinel Badge',
		description: 'Application with protected routes, reactive and centrally managed user identity.',
		ability: 'Master of Centralized Security'
	},
	status: 'coming-soon'
};
