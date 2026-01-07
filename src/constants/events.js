export const EVENTS = {
	QUEST: {
		/** @type {'quest-started'} */
		STARTED: "quest-started",
		/** @type {'quest-completed'} */
		COMPLETED: "quest-completed",
		/** @type {'chapter-changed'} */
		CHAPTER_CHANGED: "chapter-changed",
		/** @type {'return-to-hub'} */
		RETURN_TO_HUB: "return-to-hub",
	},
	UI: {
		/** @type {'theme-changed'} */
		THEME_CHANGED: "theme-changed",
		/** @type {'dialog-opened'} */
		DIALOG_OPENED: "dialog-opened",
		/** @type {'interaction-locked'} */
		INTERACTION_LOCKED: "interaction-locked",
		/** @type {'context-changed'} */
		CONTEXT_CHANGED: "context-changed",
		/** @type {'dialog-next'} */
		DIALOG_NEXT: "dialog-next",
		/** @type {'dialog-prev'} */
		DIALOG_PREV: "dialog-prev",
		/** @type {'slide-changed'} */
		SLIDE_CHANGED: "slide-changed",
		/** @type {'hero-auto-move'} */
		HERO_AUTO_MOVE: "hero-auto-move",
		/** @type {'hero-move-input'} */
		HERO_MOVE_INPUT: "hero-move-input",
	},
	SYSTEM: {
		/** @type {'data-loaded'} */
		DATA_LOADED: "data-loaded",
	},
};
