

/**
 * ServiceController - Manages user service loading
 * 
 * Handles:
 * - Service selection based on level and zone
 * - User data loading and error handling
 * - Profile context updates
 * 
 * Usage:
 * ```js
 * this.serviceController = new ServiceController(this, {
 *   services: { legacy, mock, new },
 *   profileProvider: this.profileProvider,
 *   getActiveService: () => this.getActiveService(),
 *   onDataLoaded: (userData) => { this.userData = userData; },
 *   onError: (error) => { this.userError = error; }
 * });
 * 
 * // Load data
 * await this.serviceController.loadUserData();
 * ```
 */
export class ServiceController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = {
			services: {},
			profileProvider: null,
			getActiveService: () => null,
			onDataLoaded: () => { },
			onError: () => { },
			...options
		};

		this.userData = null;
		this.userLoading = false;
		this.userError = null;

		host.addController(this);
	}

	hostConnected() {
		// No setup needed
	}

	hostDisconnected() {
		// No cleanup needed
	}

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
			serviceName: this.options.getActiveService()?.getServiceName()
		});
	}

	/**
	 * Get current user data
	 */
	getUserData() {
		return this.userData;
	}

	/**
	 * Check if data is loading
	 */
	isLoading() {
		return this.userLoading;
	}

	/**
	 * Get current error
	 */
	getError() {
		return this.userError;
	}

	/**
	 * Get active service based on service type and hot switch state
	 * @param {string} serviceType - ServiceType from chapter data
	 * @param {string} hotSwitchState - Current zone state (for dynamic injection)
	 * @returns {Object|null} Active service or null
	 */
	getActiveService(serviceType, hotSwitchState) {
		if (!serviceType) return null;

		// If service type is NEW (dynamic), check hotSwitchState
		if (serviceType === 'new') {
			if (hotSwitchState === 'legacy') return this.options.services.legacy;
			if (hotSwitchState === 'new') return this.options.services.new;
			return null; // Neutral zone - no service active
		}

		// Static service mapping
		if (serviceType === 'legacy') return this.options.services.legacy;
		if (serviceType === 'mock') return this.options.services.mock;

		return null;
	}
}
