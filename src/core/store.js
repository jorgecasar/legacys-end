import { Signal } from "@lit-labs/signals";

/**
 * @typedef {import("lit").TemplateResult} TemplateResult
 */

/**
 * @typedef {object} HeroStateSignals
 * @property {Signal.State<number>} health
 * @property {Signal.State<number>} mana
 * @property {Signal.State<number>} experience
 */

/**
 * @typedef {object} WorldStateSignals
 * @property {Signal.State<boolean>} isPaused
 * @property {Signal.State<boolean>} showDialog
 * @property {Signal.State<string | TemplateResult>} currentDialogText
 * @property {Signal.State<string | TemplateResult>} nextDialogText
 * @property {Signal.State<number>} currentSlideIndex
 */

/**
 * @typedef {object} QuestStateSignals
 * @property {Signal.State<boolean>} hasCollectedItem
 * @property {Signal.State<boolean>} isRewardCollected
 * @property {Signal.State<boolean>} isQuestCompleted
 * @property {Signal.State<string | null>} lockedMessage
 * @property {Signal.State<number>} currentChapterNumber
 * @property {Signal.State<number>} totalChapters
 * @property {Signal.State<string | TemplateResult>} levelTitle
 * @property {Signal.State<string | TemplateResult>} questTitle
 * @property {Signal.State<string | TemplateResult>} currentChapterDescription
 * @property {Signal.State<string | TemplateResult>} currentChapterCode
 * @property {Signal.State<string | TemplateResult>} currentChapterProblem
 * @property {Signal.State<string | TemplateResult>} currentChapterAnalysis
 * @property {Signal.State<string | TemplateResult>} currentChapterConfirmation
 */

/**
 * Centralized state store for the game, managing hero, world, and quest states.
 * All state modifications should go through defined actions to ensure predictability.
 */
export class GameStore {
  /** @type {HeroStateSignals} */
  hero;
  /** @type {WorldStateSignals} */
  world;
  /** @type {QuestStateSignals} */
  quest;

  constructor() {
    // Initialize Hero State with default values
    this.hero = {
      health: new Signal.State(100),
      mana: new Signal.State(50),
      experience: new Signal.State(0),
    };

    // Initialize World State with default values
    this.world = {
      isPaused: new Signal.State(false),
      showDialog: new Signal.State(false),
      currentDialogText: new Signal.State(""),
      nextDialogText: new Signal.State(""),
      currentSlideIndex: new Signal.State(0),
    };

    // Initialize Quest State with default values
    this.quest = {
      hasCollectedItem: new Signal.State(false),
      isRewardCollected: new Signal.State(false),
      isQuestCompleted: new Signal.State(false),
      lockedMessage: new Signal.State(null),
      currentChapterNumber: new Signal.State(1),
      totalChapters: new Signal.State(1),
      levelTitle: new Signal.State(""),
      questTitle: new Signal.State(""),
      currentChapterDescription: new Signal.State(""),
      currentChapterCode: new Signal.State(""),
      currentChapterProblem: new Signal.State(""),
      currentChapterAnalysis: new Signal.State(""),
      currentChapterConfirmation: new Signal.State(""),
    };
  }

  // --- World State Actions ---

  /**
   * Toggles the game pause state.
   * @param {boolean} [paused] - Optional. If provided, sets the pause state directly.
   */
  togglePause(paused = !this.world.isPaused.value) {
    this.world.isPaused.set(paused);
  }

  /**
   * Sets the visibility of the main game dialog.
   * @param {boolean} show
   */
  setShowDialog(show) {
    this.world.showDialog.set(show);
  }

  /**
   * Sets the current text displayed in the dialog.
   * @param {string | TemplateResult} text
   */
  setCurrentDialogText(text) {
    this.world.currentDialogText.set(text);
  }

  /**
   * Sets the next text to be displayed in the dialog (e.g., for pre-fetching).
   * @param {string | TemplateResult} text
   */
  setNextDialogText(text) {
    this.world.nextDialogText.set(text);
  }

  /**
   * Resets the dialog slide index to the beginning.
   */
  resetDialogSlideIndex() {
    this.world.currentSlideIndex.set(0);
  }

  /**
   * Advances to the next slide in a multi-slide dialog.
   */
  nextDialogSlide() {
    this.world.currentSlideIndex.set(this.world.currentSlideIndex.value + 1);
  }

  /**
   * Navigates to the previous slide in a multi-slide dialog, preventing negative index.
   */
  prevDialogSlide() {
    this.world.currentSlideIndex.set(
      Math.max(0, this.world.currentSlideIndex.value - 1),
    );
  }

  // --- Quest State Actions ---

  /**
   * Resets all signals related to the current quest and chapter progress.
   */
  resetQuestState() {
    this.quest.hasCollectedItem.set(false);
    this.quest.isRewardCollected.set(false);
    this.quest.isQuestCompleted.set(false);
    this.quest.lockedMessage.set(null);
    this.quest.currentChapterNumber.set(1);
    this.quest.totalChapters.set(1);
    this.quest.levelTitle.set("");
    this.quest.questTitle.set("");
    this.quest.currentChapterDescription.set("");
    this.quest.currentChapterCode.set("");
    this.quest.currentChapterProblem.set("");
    this.quest.currentChapterAnalysis.set("");
    this.quest.currentChapterConfirmation.set("");
  }

  /**
   * Sets whether the required item for the current chapter has been collected.
   * @param {boolean} collected
   */
  setHasCollectedItem(collected) {
    this.quest.hasCollectedItem.set(collected);
  }

  /**
   * Sets whether the reward for the current chapter has been collected.
   * @param {boolean} collected
   */
  setIsRewardCollected(collected) {
    this.quest.isRewardCollected.set(collected);
  }

  /**
   * Sets whether the current quest has been completed.
   * @param {boolean} completed
   */
  setIsQuestCompleted(completed) {
    this.quest.isQuestCompleted.set(completed);
  }

  /**
   * Sets a message explaining why a quest or chapter might be locked.
   * @param {string | null} message
   */
  setLockedMessage(message) {
    this.quest.lockedMessage.set(message);
  }

  /**
   * Sets the current chapter number the player is on.
   * @param {number} chapterNumber
   */
  setCurrentChapterNumber(chapterNumber) {
    this.quest.currentChapterNumber.set(chapterNumber);
  }

  /**
   * Sets the total number of chapters in the current quest.
   * @param {number} total
   */
  setTotalChapters(total) {
    this.quest.totalChapters.set(total);
  }

  /**
   * Sets the title of the current level/area.
   * @param {string | TemplateResult} title
   */
  setLevelTitle(title) {
    this.quest.levelTitle.set(title);
  }

  /**
   * Sets the title of the current quest.
   * @param {string | TemplateResult} title
   */
  setQuestTitle(title) {
    this.quest.questTitle.set(title);
  }

  /**
   * Sets the description content for the current chapter.
   * @param {string | TemplateResult} description
   */
  setCurrentChapterDescription(description) {
    this.quest.currentChapterDescription.set(description);
  }

  /**
   * Sets the code content for the current chapter.
   * @param {string | TemplateResult} code
   */
  setCurrentChapterCode(code) {
    this.quest.currentChapterCode.set(code);
  }

  /**
   * Sets the problem statement for the current chapter.
   * @param {string | TemplateResult} problem
   */
  setCurrentChapterProblem(problem) {
    this.quest.currentChapterProblem.set(problem);
  }

  /**
   * Sets the analysis content for the current chapter.
   * @param {string | TemplateResult} analysis
   */
  setCurrentChapterAnalysis(analysis) {
    this.quest.currentChapterAnalysis.set(analysis);
  }

  /**
   * Sets the confirmation content for the current chapter.
   * @param {string | TemplateResult} confirmation
   */
  setCurrentChapterConfirmation(confirmation) {
    this.quest.currentChapterConfirmation.set(confirmation);
  }

  // --- Hero State Actions ---

  /**
   * Adjusts the hero's health by a specified delta.
   * @param {number} delta - The amount to change health by (positive for gain, negative for loss).
   */
  updateHeroHealth(delta) {
    this.hero.health.set(this.hero.health.value + delta);
  }

  /**
   * Adjusts the hero's mana by a specified delta.
   * @param {number} delta - The amount to change mana by.
   */
  updateHeroMana(delta) {
    this.hero.mana.set(this.hero.mana.value + delta);
  }

  /**
   * Adjusts the hero's experience by a specified delta.
   * @param {number} delta - The amount to change experience by.
   */
  updateHeroExperience(delta) {
    this.hero.experience.set(this.hero.experience.value + delta);
  }
}
