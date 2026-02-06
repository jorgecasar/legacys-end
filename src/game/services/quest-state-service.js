import { Signal } from "@lit-labs/signals";

/** @typedef {import('../../types/game.d.js').IQuestStateService} IQuestStateService */

/**
 * QuestStateService - Manages quest progress and goals
 * @implements {IQuestStateService}
 */
export class QuestStateService {
	constructor() {
		this.hasCollectedItem = new Signal.State(false);
		this.isRewardCollected = new Signal.State(false);
		this.isQuestCompleted = new Signal.State(false);
		this.lockedMessage = new Signal.State(/** @type {string|null} */ (null));
		this.currentChapterNumber = new Signal.State(1);
		this.totalChapters = new Signal.State(1);
		this.levelTitle = new Signal.State(
			/** @type {string | import('lit').TemplateResult} */ (""),
		);
		this.questTitle = new Signal.State(
			/** @type {string | import('lit').TemplateResult} */ (""),
		);
		this.currentChapterId = new Signal.State(/** @type {string|null} */ (null));
	}

	/**
	 * @param {boolean} collected
	 */
	setHasCollectedItem(collected) {
		this.hasCollectedItem.set(collected);
	}

	/**
	 * @param {boolean} collected
	 */
	setIsRewardCollected(collected) {
		this.isRewardCollected.set(collected);
	}

	/**
	 * @param {boolean} completed
	 */
	setIsQuestCompleted(completed) {
		this.isQuestCompleted.set(completed);
	}

	/**
	 * @param {string|null} message
	 */
	setLockedMessage(message) {
		this.lockedMessage.set(message);
	}

	/** @param {number} n */
	setCurrentChapterNumber(n) {
		this.currentChapterNumber.set(n);
	}

	/** @param {number} n */
	setTotalChapters(n) {
		this.totalChapters.set(n);
	}

	/** @param {string | import('lit').TemplateResult} title */
	setLevelTitle(title) {
		this.levelTitle.set(title);
	}

	/** @param {string | import('lit').TemplateResult} title */
	setQuestTitle(title) {
		this.questTitle.set(title);
	}

	/** @param {string|null} id */
	setCurrentChapterId(id) {
		this.currentChapterId.set(id);
	}

	resetChapterState() {
		this.hasCollectedItem.set(false);
		this.isRewardCollected.set(false);
		this.lockedMessage.set(null);
	}

	resetQuestState() {
		this.resetChapterState();
		this.isQuestCompleted.set(false);
	}
}
