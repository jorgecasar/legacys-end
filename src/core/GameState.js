/**
 * Represents the game state.
 */
export class GameState {
    /**
     * @param {Object} config
     * @param {string} config.level
     * @param {Object} config.heroPos
     * @param {number} config.heroPos.x
     * @param {number} config.heroPos.y
     * @param {string} config.hotSwitchState
     * @param {boolean} config.hasCollectedItem
     */
    constructor(config) {
        this.level = config.level;
        this.heroPos = config.heroPos;
        this.hotSwitchState = config.hotSwitchState;
        this.hasCollectedItem = config.hasCollectedItem;
    }
}
