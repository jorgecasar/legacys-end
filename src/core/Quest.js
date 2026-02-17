/**
 * Represents a quest.
 */
export class Quest {
    /**
     * @param {Object} config
     * @param {string} config.id
     * @param {string} config.state
     */
    constructor(config) {
        this.id = config.id;
        this.state = config.state;
    }
}
