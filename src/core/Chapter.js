/**
 * Represents a chapter.
 */
export class Chapter {
    /**
     * @param {Object} config
     * @param {string} config.id
     * @param {NPC} config.npc
     */
    constructor(config) {
        this.id = config.id;
        this.npc = config.npc;
    }
}
