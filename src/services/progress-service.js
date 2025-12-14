import { QUESTS, getQuest, isQuestLocked } from '../quests/quest-registry.js';
import { QuestType } from '../quests/quest-types.js';

/**
 * ProgressService - Manages player progress and persistence
 * 
 * Tracks:
 * - Completed quests and chapters
 * - Current quest/chapter
 * - Unlocked quests
 * - Achievements
 * 
 * Persists to localStorage
 */
export class ProgressService {
	constructor() {
		this.storageKey = 'legacys-end-progress';
		this.progress = this.loadProgress();
	}

	/**
	 * Load progress from localStorage
	 */
	loadProgress() {
		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				const data = JSON.parse(stored);
				console.log('💾 Loaded progress:', data);
				return data;
			}
		} catch (e) {
			console.error('Failed to load progress:', e);
		}

		// Default progress for new players
		console.log('🆕 Creating new progress');
		return {
			completedQuests: [],
			completedChapters: [],
			currentQuest: null,
			currentChapter: null,
			unlockedQuests: ['the-aura-of-sovereignty'], // First quest always unlocked
			achievements: [],
			stats: {
				totalPlayTime: 0,
				questsCompleted: 0,
				chaptersCompleted: 0
			},
			chapterStates: {} // Stores state per chapter (e.g. collectedItem)
		};
	}

	/**
	 * Save progress to localStorage
	 */
	saveProgress() {
		try {
			console.log('💾 Saving progress:', this.progress);
			localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
		} catch (e) {
			console.error('Failed to save progress:', e);
		}
	}

	/**
	 * Reset all progress (for testing or new game)
	 */
	resetProgress() {
		this.progress = this.loadProgress();
		localStorage.removeItem(this.storageKey);
		this.progress = {
			completedQuests: [],
			completedChapters: [],
			currentQuest: null,
			currentChapter: null,
			unlockedQuests: ['the-aura-of-sovereignty'],
			achievements: [],
			stats: {
				totalPlayTime: 0,
				questsCompleted: 0,
				chaptersCompleted: 0
			},
			chapterStates: {}
		};
		this.saveProgress();
	}

	/**
	 * Reset progress for a specific quest
	 * @param {string} questId 
	 */
	resetQuestProgress(questId) {
		const quest = getQuest(questId);
		if (!quest) return;

		// Remove from completed quests
		this.progress.completedQuests = this.progress.completedQuests.filter(id => id !== questId);

		// Remove quest chapters from completed chapters
		if (quest.chapterIds) {
			this.progress.completedChapters = this.progress.completedChapters.filter(
				chapterId => !quest.chapterIds.includes(chapterId)
			);
		}

		// Reset current quest if it matches
		if (this.progress.currentQuest === questId) {
			this.progress.currentQuest = null;
			this.progress.currentChapter = null;
		}

		this.saveProgress();
		console.log(`🔄 Reset progress for quest: ${questId}`);
	}

	/**
	 * Mark a chapter as completed
	 */
	completeChapter(chapterId) {
		if (!this.progress.completedChapters.includes(chapterId)) {
			this.progress.completedChapters.push(chapterId);
			this.progress.stats.chaptersCompleted++;
			this.saveProgress();
			console.log(`💾 Completing chapter: ${chapterId}`);
		} else {
			console.warn(`⚠️ Chapter ${chapterId} already completed`);
		}

		// Removed auto-check for quest completion here. 
		// Quest completion should be driven by the QuestController flow 
		// to prevent premature completion if chapters were previously completed.
	}

	/**
	 * Check if current quest is completed and handle completion
	 */
	checkQuestCompletion() {
		if (!this.progress.currentQuest) return;

		const quest = getQuest(this.progress.currentQuest);
		if (!quest || !quest.chapterIds) return;

		// Check if all chapters are completed
		const allChaptersComplete = quest.chapterIds.every(chapterId =>
			this.progress.completedChapters.includes(chapterId)
		);

		if (allChaptersComplete) {
			console.log(`🎉 All chapters completed for quest ${quest.id}`);
			this.completeQuest(quest.id);
		}
	}

	/**
	 * Mark a quest as completed
	 */
	completeQuest(questId) {
		if (!this.progress.completedQuests.includes(questId)) {
			this.progress.completedQuests.push(questId);
			this.progress.stats.questsCompleted++;

			// Ensure all chapters are marked as completed (consistency check)
			const quest = getQuest(questId);
			if (quest && quest.chapterIds) {
				quest.chapterIds.forEach(chapterId => {
					if (!this.progress.completedChapters.includes(chapterId)) {
						this.progress.completedChapters.push(chapterId);
						this.progress.stats.chaptersCompleted++;
					}
				});
			}

			// Award achievement
			if (quest?.reward?.badge) {
				this.unlockAchievement(quest.reward.badge);
			}

			this.saveProgress();
			this.unlockNewQuests();
		}
	}

	/**
	 * Unlock quests that have their prerequisites met
	 */
	unlockNewQuests() {
		Object.values(QUESTS).forEach(quest => {
			if (quest.type === QuestType.QUEST && !this.progress.unlockedQuests.includes(quest.id)) {
				// Check if all prerequisites are completed
				if (!isQuestLocked(quest.id, this.progress.completedQuests)) {
					this.progress.unlockedQuests.push(quest.id);
				}
			}
		});
		this.saveProgress();
	}

	/**
	 * Unlock an achievement
	 */
	unlockAchievement(achievementId) {
		if (!this.progress.achievements.includes(achievementId)) {
			this.progress.achievements.push(achievementId);
			this.saveProgress();
		}
	}

	/**
	 * Set current quest and chapter
	 */
	setCurrentQuest(questId, chapterId = null) {
		this.progress.currentQuest = questId;
		this.progress.currentChapter = chapterId;
		this.saveProgress();
	}

	/**
	 * Check if a quest is available to play
	 */
	isQuestAvailable(questId) {
		return this.progress.unlockedQuests.includes(questId);
	}

	/**
	 * Check if a quest is completed
	 */
	isQuestCompleted(questId) {
		return this.progress.completedQuests.includes(questId);
	}

	/**
	 * Check if a chapter is completed
	 */
	isChapterCompleted(chapterId) {
		return this.progress.completedChapters.includes(chapterId);
	}

	/**
	 * Get quest completion percentage
	 */
	getQuestProgress(questId) {
		if (this.isQuestCompleted(questId)) {
			return 100;
		}

		const quest = getQuest(questId);
		if (!quest || !quest.chapterIds || quest.chapterIds.length === 0) {
			return 0;
		}

		const completedCount = quest.chapterIds.filter(chapterId =>
			this.isChapterCompleted(chapterId)
		).length;

		return Math.round((completedCount / quest.chapterIds.length) * 100);
	}

	/**
	 * Get overall game completion percentage
	 */
	getOverallProgress() {
		const allQuests = Object.values(QUESTS).filter(q => q.type === 'quest' && q.status !== 'coming-soon');
		if (allQuests.length === 0) return 0;

		const completedCount = allQuests.filter(q =>
			this.isQuestCompleted(q.id)
		).length;

		return Math.round((completedCount / allQuests.length) * 100);
	}

	/**
	 * Get current progress object (for debugging/display)
	 */
	getProgress() {
		return { ...this.progress };
	}

	/**
	 * Update state for a specific chapter
	 * @param {string} chapterId 
	 * @param {Object} state 
	 */
	updateChapterState(chapterId, state) {
		if (!this.progress.chapterStates) {
			this.progress.chapterStates = {};
		}

		this.progress.chapterStates[chapterId] = {
			...(this.progress.chapterStates[chapterId] || {}),
			...state
		};
		this.saveProgress();
	}

	/**
	 * Get state for a specific chapter
	 * @param {string} chapterId 
	 */
	getChapterState(chapterId) {
		if (!this.progress.chapterStates) return {};
		return this.progress.chapterStates[chapterId] || {};
	}
}
