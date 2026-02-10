import { createContext } from "@lit/context";
import { Signal } from "@lit-labs/signals";

/** @typedef {import('../types/game.d.js').HotSwitchState} HotSwitchState */

/**
 * GameStore - Centralized state management for Legacy's End
 */
export class GameStore {
	constructor() {
		this.hero = new HeroStore();
		this.quest = new QuestStore();
		this.world = new WorldStore();
	}
}

class HeroStore {
	constructor() {
		this.pos = new Signal.State({ x: 50, y: 15 });
		this.hotSwitchState = new Signal.State(
			/** @type {HotSwitchState} */ (null),
		);
		this.isEvolving = new Signal.State(false);
		this.imageSrc = new Signal.State("");
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	setPos(x, y) {
		this.pos.set({ x, y });
	}

	/**
	 * @param {HotSwitchState} state
	 */
	setHotSwitchState(state) {
		this.hotSwitchState.set(state);
	}

	/**
	 * @param {boolean} evolving
	 */
	setIsEvolving(evolving) {
		this.isEvolving.set(evolving);
	}

	/**
	 * @param {string} src
	 */
	setImageSrc(src) {
		this.imageSrc.set(src ?? "");
	}
}

class QuestStore {
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

	/** */
	resetChapterState() {
		this.hasCollectedItem.set(false);
		this.isRewardCollected.set(false);
		this.lockedMessage.set(null);
	}

	/** */
	resetQuestState() {
		this.resetChapterState();
		this.isQuestCompleted.set(false);
	}
}

class WorldStore {
	constructor() {
		this.isPaused = new Signal.State(false);
		this.showDialog = new Signal.State(false);
		this.currentDialogText = new Signal.State("");
		this.nextDialogText = new Signal.State("");
		this.currentSlideIndex = new Signal.State(0);
	}

	/**
	 * @param {boolean} paused
	 */
	setPaused(paused) {
		this.isPaused.set(paused);
	}

	/**
	 * @param {boolean} show
	 */
	setShowDialog(show) {
		this.showDialog.set(show);
		if (show) {
			this.resetSlideIndex();
		}
	}

	/**
	 * @param {string} text
	 */
	setCurrentDialogText(text) {
		this.currentDialogText.set(text || "");
	}

	/**
	 * @param {string} text
	 */
	setNextDialogText(text) {
		this.nextDialogText.set(text || "");
	}

	/** */
	nextSlide() {
		this.currentSlideIndex.set(this.currentSlideIndex.get() + 1);
	}

	/** */
	prevSlide() {
		this.currentSlideIndex.set(Math.max(this.currentSlideIndex.get() - 1, 0));
	}

	/**
	 * @param {number} index
	 */
	setSlideIndex(index) {
		this.currentSlideIndex.set(index);
	}

	/** */
	resetSlideIndex() {
		this.currentSlideIndex.set(0);
	}

	resetWorldState() {
		this.isPaused.set(false);
		this.showDialog.set(false);
		this.currentDialogText.set("");
		this.nextDialogText.set("");
		this.resetSlideIndex();
	}
}

export const gameStoreContext = createContext(Symbol("game-store"));
