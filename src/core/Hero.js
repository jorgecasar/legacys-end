/**
 * Represents the player character.
 */
export class Hero {
    /**
     * @param {Object} config
     * @param {number} config.x
     * @param {number} config.y
     */
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
    }
}
