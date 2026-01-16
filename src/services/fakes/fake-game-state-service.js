import { signal } from "@lit-labs/signals";
import { GameStateService } from "../game-state-service.js";

/**
 * FakeGameStateService
 * A concrete implementation of GameStateService that runs in-memory.
 */
export class FakeGameStateService extends GameStateService {
	constructor() {
		super(undefined);
		this.heroPos = signal({ x: 0, y: 0 });
		this.hasCollectedItem = signal(false);
		this.isPaused = signal(false);
		this.isQuestCompleted = signal(false);
		this.isRewardCollected = signal(false);
		/** @type {import('@lit-labs/signals').State<import('../game-state-service.js').HotSwitchState>} */
		this.hotSwitchState = signal("legacy");
		this.isEvolving = signal(false);
		this.showDialog = signal(false);
		/** @type {import('@lit-labs/signals').State<string|null>} */
		this.lockedMessage = signal(null);
		this.currentDialogText = signal("");

		// Shims for domain services
		this.heroState = /** @type {any} */ ({
			pos: this.heroPos,
			hotSwitchState: this.hotSwitchState,
			isEvolving: this.isEvolving,
			/** @param {number} x @param {number} y */
			setPos: (x, y) => this.heroPos.set({ x, y }),
			/** @param {import('../game-state-service.js').HotSwitchState} s */
			setHotSwitchState: (s) => this.hotSwitchState.set(s),
			/** @param {boolean} v */
			setIsEvolving: (v) => this.isEvolving.set(v),
		});

		this.questState = /** @type {any} */ ({
			hasCollectedItem: this.hasCollectedItem,
			isRewardCollected: this.isRewardCollected,
			isQuestCompleted: this.isQuestCompleted,
			lockedMessage: this.lockedMessage,
			/** @param {boolean} v */
			setHasCollectedItem: (v) => this.hasCollectedItem.set(v),
			/** @param {boolean} v */
			setIsRewardCollected: (v) => this.isRewardCollected.set(v),
			/** @param {boolean} v */
			setIsQuestCompleted: (v) => this.isQuestCompleted.set(v),
			/** @param {string|null} v */
			setLockedMessage: (v) => this.lockedMessage.set(v),
			resetChapterState: () => {
				this.hasCollectedItem.set(false);
				this.lockedMessage.set(null);
			},
			resetQuestState: () => {
				this.isQuestCompleted.set(false);
				this.isRewardCollected.set(false);
			},
		});

		this.worldState = /** @type {any} */ ({
			isPaused: this.isPaused,
			showDialog: this.showDialog,
			currentDialogText: this.currentDialogText,
			/** @param {boolean} v */
			setPaused: (v) => this.isPaused.set(v),
			/** @param {boolean} v */
			setShowDialog: (v) => this.showDialog.set(v),
			/** @param {string} v */
			setCurrentDialogText: (v) => this.currentDialogText.set(v),
		});
	}

	// Helper to inspect state easily in tests
	get current() {
		return {
			heroPos: this.heroPos.get(),
			isPaused: this.isPaused.get(),
			isQuestCompleted: this.isQuestCompleted.get(),
			isInHub: true,
		};
	}
}
