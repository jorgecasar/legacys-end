/**
 * Game Domain Service Interfaces
 */

/**
 * @typedef {import('../core/constants.js').HotSwitchState} HotSwitchState
 */

/**
 * @typedef {Object} IHeroStateService
 * @property {{ get(): {x: number, y: number} }} pos
 * @property {{ get(): HotSwitchState }} hotSwitchState
 * @property {{ get(): boolean }} isEvolving
 * @property {{ get(): string }} imageSrc
 * @property {(x: number, y: number) => void} setPos
 * @property {(state: HotSwitchState) => void} setHotSwitchState
 * @property {(evolving: boolean) => void} setIsEvolving
 * @property {(src: string) => void} setImageSrc
 */

/**
 * @typedef {Object} IQuestStateService
 * @property {{ get(): boolean }} hasCollectedItem
 * @property {{ get(): boolean }} isRewardCollected
 * @property {{ get(): boolean }} isQuestCompleted
 * @property {{ get(): string|null }} lockedMessage
 * @property {{ get(): number }} currentChapterNumber
 * @property {{ get(): number }} totalChapters
 * @property {{ get(): string | import('lit').TemplateResult }} levelTitle
 * @property {{ get(): string | import('lit').TemplateResult }} questTitle
 * @property {{ get(): string|null }} currentChapterId
 * @property {(collected: boolean) => void} setHasCollectedItem
 * @property {(collected: boolean) => void} setIsRewardCollected
 * @property {(completed: boolean) => void} setIsQuestCompleted
 * @property {(message: string|null) => void} setLockedMessage
 * @property {(n: number) => void} setCurrentChapterNumber
 * @property {(n: number) => void} setTotalChapters
 * @property {(title: string | import('lit').TemplateResult) => void} setLevelTitle
 * @property {(title: string | import('lit').TemplateResult) => void} setQuestTitle
 * @property {(id: string|null) => void} setCurrentChapterId
 * @property {() => void} resetChapterState
 * @property {() => void} resetQuestState
 */

/**
 * @typedef {Object} IWorldStateService
 * @property {{ get(): boolean }} isPaused
 * @property {{ get(): boolean }} showDialog
 * @property {{ get(): string }} currentDialogText
 * @property {{ get(): string }} nextDialogText
 * @property {{ get(): number }} currentSlideIndex
 * @property {(paused: boolean) => void} setPaused
 * @property {(show: boolean) => void} setShowDialog
 * @property {(text: string) => void} setCurrentDialogText
 * @property {(text: string) => void} setNextDialogText
 * @property {() => void} nextSlide
 * @property {() => void} prevSlide
 * @property {(index: number) => void} setSlideIndex
 * @property {() => void} resetSlideIndex
 */

export {};
