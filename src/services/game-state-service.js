/**
 * GameStateService - Manages ephemeral game state
 * 
 * Tracks:
 * - Hero position
 * - Collected items (per session/chapter)
 * - Active context (hot switch state)
 * - UI state (paused, evolving, locked messages)
 * - Theme mode
 */
export class GameStateService {
	constructor() {
		this.listeners = new Set();
		this.state = {
			heroPos: { x: 50, y: 15 },
			hasCollectedItem: false,
			isRewardCollected: false,
			hotSwitchState: null,
			isPaused: false,
			isEvolving: false,
			lockedMessage: null,
			themeMode: 'light'
		};
	}

	/**
	 * Get current state
	 */
	getState() {
		return { ...this.state };
	}

	/**
	 * Update state and notify listeners
	 * @param {Object} partialState 
	 */
	setState(partialState) {
		const oldState = { ...this.state };
		this.state = { ...this.state, ...partialState };
		this.notifyListeners(this.state, oldState);
	}

	/**
	 * Subscribe to state changes
	 * @param {Function} listener 
	 * @returns {Function} Unsubscribe function
	 */
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Notify all listeners of state change
	 */
	notifyListeners(newState, oldState) {
		this.listeners.forEach(listener => listener(newState, oldState));
	}

	// --- Convenience Methods ---

	setHeroPosition(x, y) {
		this.setState({ heroPos: { x, y } });
	}

	setCollectedItem(collected) {
		this.setState({ hasCollectedItem: collected });
	}

	setRewardCollected(collected) {
		this.setState({ isRewardCollected: collected });
	}

	setHotSwitchState(state) {
		this.setState({ hotSwitchState: state });
	}

	setPaused(paused) {
		this.setState({ isPaused: paused });
	}

	setEvolving(evolving) {
		this.setState({ isEvolving: evolving });
	}

	setLockedMessage(message) {
		this.setState({ lockedMessage: message });
	}

	setThemeMode(mode) {
		this.setState({ themeMode: mode });
	}

	resetChapterState() {
		this.setState({
			hasCollectedItem: false,
			isRewardCollected: false,
			lockedMessage: null,
			isEvolving: false
		});
	}
}
