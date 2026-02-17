/**
 * Represents a non-player character.
 */
export class NPC {
    /**
     * @param {Object} config
     * @param {string} config.dialog
     * @param {Object} config.position
     * @param {number} config.position.x
     * @param {number} config.position.y
     */
    constructor(config) {
        this.dialog = config.dialog;
        this.position = config.position;
    }
}
