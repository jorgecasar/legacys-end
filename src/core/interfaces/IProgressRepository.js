// src/core/interfaces/IProgressRepository.js

/**
 * @interface
 */
export class IProgressRepository {
	/**
	 * Saves the user's progress.
	 * @param {string} _userId - The ID of the user.
	 * @param {object} _progressData - The progress data to save.
	 * @returns {Promise<void>}
	 */
	async saveProgress(_userId, _progressData) {
		throw new Error("Method 'saveProgress' must be implemented.");
	}

	/**
	 * Loads the user's progress.
	 * @param {string} _userId - The ID of the user.
	 * @returns {Promise<object|null>}
	 */
	async loadProgress(_userId) {
		throw new Error("Method 'loadProgress' must be implemented.");
	}

	/**
	 * Deletes the user's progress.
	 * @param {string} _userId - The ID of the user.
	 * @returns {Promise<void>}
	 */
	async deleteProgress(_userId) {
		throw new Error("Method 'deleteProgress' must be implemented.");
	}

	/**
	 * Retrieves all progress data.
	 * @returns {Promise<object[]>}
	 */
	async getAllProgress() {
		throw new Error("Method 'getAllProgress' must be implemented.");
	}
}
