/**
 * @typedef {import('../types/quests.d.js').Quest} Quest
 */

import { Signal } from "@lit-labs/signals";

/**
 * SessionService - Manages application-level session state
 *
 * Tracks:
 * - Loading state
 * - View mode (Hub vs Game)
 * - Current active quest
 */
export class SessionService {
	constructor() {
		this.isLoading = new Signal.State(false);
		this.isInHub = new Signal.State(true);
		this.currentQuest = new Signal.State(/** @type {Quest|null} */ (null));
	}

	/** @param {boolean} loading */
	setLoading(loading) {
		this.isLoading.set(loading);
	}

	/** @param {boolean} inHub */
	setIsInHub(inHub) {
		this.isInHub.set(inHub);
	}

	/** @param {Quest|null} quest */
	setCurrentQuest(quest) {
		this.currentQuest.set(quest);
	}
}
