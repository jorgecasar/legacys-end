/**
 * @typedef {typeof import('../core/constants.js').HotSwitchStates[keyof typeof import('../core/constants.js').HotSwitchStates] | null} HotSwitchState
 */

/**
 * Game Domain Service Interfaces
 */

/**
 * Hero State Service Interface
 * Manages all ephemeral state related to the Hero character, such as position and visual appearance.
 * @typedef {Object} IHeroStateService
 * @property {{ get(): {x: number, y: number} }} pos - Reactive state for the hero's position (Vector2).
 * @property {{ get(): HotSwitchState }} hotSwitchState - Reactive state for character swapping mechanics.
 * @property {{ get(): boolean }} isEvolving - Reactive state indicating if the hero is currently evolving/animating.
 * @property {{ get(): string }} imageSrc - Reactive state for the current sprite or image source.
 * @property {(x: number, y: number) => void} setPos - Updates the hero's position.
 * @property {(state: HotSwitchState) => void} setHotSwitchState - Updates the hot-switch state.
 * @property {(evolving: boolean) => void} setIsEvolving - Sets the evolving flag.
 * @property {(src: string) => void} setImageSrc - Updates the hero's image source.
 */

/**
 * Quest State Service Interface
 * Manages the state of the active quest, including progress, chapters, and completion criteria.
 * @typedef {Object} IQuestStateService
 * @property {{ get(): boolean }} hasCollectedItem - Reactive state: true if the objective item has been collected.
 * @property {{ get(): boolean }} isRewardCollected - Reactive state: true if the chapter reward has been claimed.
 * @property {{ get(): boolean }} isQuestCompleted - Reactive state: true if the entire quest is finished.
 * @property {{ get(): string|null }} lockedMessage - Reactive state: message explaining why interaction is locked, if any.
 * @property {{ get(): number }} currentChapterNumber - Reactive state: the human-readable number of the current chapter.
 * @property {{ get(): number }} totalChapters - Reactive state: total number of chapters in the quest.
 * @property {{ get(): string | import('lit').TemplateResult }} levelTitle - Reactive state: title of the current level/chapter.
 * @property {{ get(): string | import('lit').TemplateResult }} questTitle - Reactive state: title of the overall quest.
 * @property {{ get(): string|null }} currentChapterId - Reactive state: unique identifier of the active chapter.
 * @property {(collected: boolean) => void} setHasCollectedItem - Updates collection status.
 * @property {(collected: boolean) => void} setIsRewardCollected - Updates reward collection status.
 * @property {(completed: boolean) => void} setIsQuestCompleted - Marks the quest as completed.
 * @property {(message: string|null) => void} setLockedMessage - Sets or clears the lock message.
 * @property {(n: number) => void} setCurrentChapterNumber - Updates the current chapter number.
 * @property {(n: number) => void} setTotalChapters - Sets the total chapter count.
 * @property {(title: string | import('lit').TemplateResult) => void} setLevelTitle - Updates the level title.
 * @property {(title: string | import('lit').TemplateResult) => void} setQuestTitle - Updates the quest title.
 * @property {(id: string|null) => void} setCurrentChapterId - Sets the current chapter ID.
 * @property {() => void} resetChapterState - Resets ephemeral state for the current chapter (items, rewards).
 * @property {() => void} resetQuestState - Resets all quest-related state to initial values.
 */

/**
 * World State Service Interface
 * Manages global environment state, dialogs, and the pause system.
 * @typedef {Object} IWorldStateService
 * @property {{ get(): boolean }} isPaused - Reactive state: true if the game world is paused.
 * @property {{ get(): boolean }} showDialog - Reactive state: true if the dialog overlay is visible.
 * @property {{ get(): string }} currentDialogText - Reactive state: text currently displayed in the dialog.
 * @property {{ get(): string }} nextDialogText - Reactive state: text queued for the next dialog slide.
 * @property {{ get(): number }} currentSlideIndex - Reactive state: index of the current dialog slide.
 * @property {(paused: boolean) => void} setPaused - Pauses or resumes the game.
 * @property {(show: boolean) => void} setShowDialog - Shows or hides the dialog overlay.
 * @property {(text: string) => void} setCurrentDialogText - Updates the current dialog text.
 * @property {(text: string) => void} setNextDialogText - Queues the next dialog text.
 * @property {() => void} nextSlide - Advances to the next dialog slide.
 * @property {() => void} prevSlide - Returns to the previous dialog slide.
 * @property {(index: number) => void} setSlideIndex - Jumps to a specific dialog slide.
 * @property {() => void} resetSlideIndex - Resets the slide index to 0.
 * @property {() => void} resetWorldState - Resets all world state (pause, dialogs) to default.
 */

export {};
