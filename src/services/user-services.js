/**
 * Enum for Service Types
 * @readonly
 * @enum {string}
 */
export const ServiceType = {
	LEGACY: "Legacy API",
	MOCK: "Mock Service",
	NEW: "New V2 API",
};

/**
 * @typedef {Object} UserData
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {number} hp
 * @property {string} avatarColor
 */

/**
 * @typedef {Object} IUserService
 * @property {function(number): Promise<UserData>} fetchUserData
 * @property {function(): string} getServiceName
 */

/** @param {number} ms */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * LegacyUserService - Simulates a slow, legacy API response.
 * @implements {IUserService}
 */
export class LegacyUserService {
	/**
	 * Fetch user data with a simulated delay.
	 * @param {number} id - The user ID
	 * @returns {Promise<UserData>}
	 */
	async fetchUserData(id) {
		await delay(500);
		return {
			id,
			name: "Alarion",
			role: "Monolith Dweller",
			hp: 50,
			avatarColor: "#ef4444", // Red
		};
	}

	/**
	 * Get the service type identifier.
	 * @returns {string}
	 */
	getServiceName() {
		return ServiceType.LEGACY;
	}
}

/**
 * MockUserService - Provides dummy data for testing purposes.
 * @implements {IUserService}
 */
export class MockUserService {
	/**
	 * Fetch mock user data.
	 * @param {number} id - The user ID
	 * @returns {Promise<UserData>}
	 */
	async fetchUserData(id) {
		await delay(500);
		return {
			id,
			name: "Test Dummy",
			role: "QA Subject",
			hp: 9999,
			avatarColor: "#eab308", // Yellow
		};
	}

	/**
	 * Get the service type identifier.
	 * @returns {string}
	 */
	getServiceName() {
		return ServiceType.MOCK;
	}
}

/**
 * NewUserService - Simulates the modern V2 API response.
 * @implements {IUserService}
 */
export class NewUserService {
	/**
	 * Fetch user data from the new system.
	 * @param {number} id - The user ID
	 * @returns {Promise<UserData>}
	 */
	async fetchUserData(id) {
		await delay(500);
		return {
			id,
			name: "Alarion",
			role: "System Walker",
			hp: 100,
			avatarColor: "#22c55e", // Green
		};
	}

	/**
	 * Get the service type identifier.
	 * @returns {string}
	 */
	getServiceName() {
		return ServiceType.NEW;
	}
}
