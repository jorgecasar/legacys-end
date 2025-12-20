/** @typedef {import("../services/user-services.js").IUserService} IUserService */
/** @typedef {import("../services/user-services.js").UserData} UserData */
/** @typedef {import("../services/user-services.js").ServiceType} ServiceType */

/**
 * @typedef {Object} ServiceControllerOptions
 * @property {Object} [services] - Map of service instances {legacy, mock, new}
 * @property {Object} [profileProvider] - Profile context provider
 * @property {() => IUserService|null} [getActiveService] - Function to get active service
 * @property {(userData: UserData) => void} [onDataLoaded] - Callback when data loads
 * @property {(error: string) => void} [onError] - Callback on error
 */

/**
 * ServiceController - Manages user service loading
 *
 * Handles:
 * - Service selection based on level and zone
 * - User data loading and error handling
 * - Profile context updates
 *
 * @implements {import('lit').ReactiveController}
 */
export class ServiceController {
	/**
	 * @param {import('lit').ReactiveControllerHost} host
	 * @param {Partial<ServiceControllerOptions>} [options]
	 */
	constructor(host, options = {}) {
		/** @type {import('lit').ReactiveControllerHost} */
		this.host = host;
		/** @type {ServiceControllerOptions} */
		this.options = {
			services: {},
			profileProvider: null,
			getActiveService: () => null,
			onDataLoaded: () => { },
			onError: () => { },
			...options,
		};

		/** @type {UserData|null} */
		this.userData = null;
		/** @type {boolean} */
		this.userLoading = false;
		/** @type {string|null} */
		this.userError = null;

		host.addController(this);
	}

	hostConnected() { }

	hostDisconnected() { }

	/**
	 * Load user data from active service
	 */
	async loadUserData() {
		this.userLoading = true;
		this.userError = null;
		this.updateProfileContext();

		try {
			const service = this.options.getActiveService();
			if (service) {
				this.userData = await service.fetchUserData(1);
				this.options.onDataLoaded(this.userData);
			}
		} catch (e) {
			this.userError = e.message;
			this.options.onError(e.message);
		} finally {
			this.userLoading = false;
			this.updateProfileContext();
		}
	}

	/**
	 * Update profile context with current state
	 */
	updateProfileContext() {
		if (!this.options.profileProvider) return;

		this.options.profileProvider.setValue({
			name: this.userData?.name,
			role: this.userData?.role,
			loading: this.userLoading,
			error: this.userError,
			serviceName: this.options.getActiveService()?.getServiceName(),
		});
	}

	/**
	 * Get current user data
	 * @returns {UserData|null}
	 */
	getUserData() {
		return this.userData;
	}

	/**
	 * Check if data is loading
	 * @returns {boolean}
	 */
	isLoading() {
		return this.userLoading;
	}

	/**
	 * Get current error
	 * @returns {string|null}
	 */
	getError() {
		return this.userError;
	}

	/**
	 * Get active service based on service type and hot switch state
	 * @param {ServiceType} serviceType - ServiceType from chapter data
	 * @param {import('../services/game-state-service.js').HotSwitchState} hotSwitchState - Current zone state (for dynamic injection)
	 * @returns {IUserService|null} Active service or null
	 */
	getActiveService(serviceType, hotSwitchState) {
		if (!serviceType) return null;

		// If service type is NEW (dynamic), check hotSwitchState
		if (serviceType === "new") {
			if (hotSwitchState === "legacy") return this.options.services.legacy;
			if (hotSwitchState === "new") return this.options.services.new;
			return null; // Neutral zone - no service active
		}

		// Static service mapping
		if (serviceType === "legacy") return this.options.services.legacy;
		if (serviceType === "mock") return this.options.services.mock;

		return null;
	}
}
