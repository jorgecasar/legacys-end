// src/core/interfaces/IQuestRepository.js

/**
 * @interface
 */
export class IQuestRepository {
	/**
	 * Finds a quest by its unique identifier.
	 * @param {string} _id - The unique identifier of the quest.
	 * @returns {Promise<import("../entities.js").Quest | null>} A promise that resolves to the quest or null if not found.
	 */
	async findById(_id) {
		throw new Error("Method 'findById()' must be implemented.");
	}

	/**
	 * Retrieves all quests.
	 * @returns {Promise<import("../entities.js").Quest[]>} A promise that resolves to an array of all quests.
	 */
	async findAll() {
		throw new Error("Method 'findAll()' must be implemented.");
	}

	/**
	 * Saves a quest. This can be an update to an existing quest or a new quest.
	 * @param {import("../entities.js").Quest} _quest - The quest to save.
	 * @returns {Promise<void>} A promise that resolves when the quest is saved.
	 */
	async save(_quest) {
		throw new Error("Method 'save()' must be implemented.");
	}

	/**
	 * Deletes a quest by its unique identifier.
	 * @param {string} _id - The unique identifier of the quest to delete.
	 * @returns {Promise<void>} A promise that resolves when the quest is deleted.
	 */
	async delete(_id) {
		throw new Error("Method 'delete()' must be implemented.");
	}
}
