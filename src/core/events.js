/**
 * Global Game Events
 * Centralized registry of all events dispatched within the application.
 */
export const GameEvents = {
	LEVEL_COMPLETED: "level-completed",
	QUEST_COMPLETED: "quest-completed",
	LEVEL_FAILED: "level-failed",
	HERO_DEATH: "hero-death",
	INTERACT: "interact",
};

/**
 * UI Events
 * Events triggered by UI interactions.
 */
export const UIEvents = {
	RESUME: "resume",
	RESTART: "restart",
	QUIT: "quit",
	RETURN_TO_HUB: "return-to-hub",
	OPTIONS: "options",
	LANGUAGE_CHANGED: "language-changed",
	THEME_CHANGED: "theme-changed",
	REWARD_COLLECTED: "reward-collected",
	NEXT_SLIDE: "next-slide",
	PREV_SLIDE: "prev-slide",
	MOVE: "move",
	MOVE_TO: "move-to",
	INTERACT: "interact",
	TOGGLE_PAUSE: "toggle-pause",
	NEXT_CHAPTER: "next-chapter",
	MOVE_TO_NPC: "move-to-npc",
	MOVE_TO_EXIT: "move-to-exit",
	TOGGLE_VOICE: "toggle-voice",
	SLIDE_CHANGED: "slide-changed",
	COMPLETE: "complete", // Generic completion (dialogs, etc)
	CLOSE: "close", // Generic close
	CLOSE_DIALOG: "close-dialog",
	REQUEST_DIALOG: "request-dialog",
	SHOW_LOCKED_MESSAGE: "show-locked-message",
	QUEST_SELECT: "quest-select",
	QUEST_CONTINUE: "quest-continue",
	RESET_PROGRESS: "reset-progress",
};
