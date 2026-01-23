/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 */

import { Task, TaskStatus } from "@lit/task";
import { HotSwitchStates } from "../core/constants.js";
import { ServiceType } from "../services/user-api-client.js";

/** @typedef {import("../services/user-api-client.js").IUserApiClient} IUserApiClient */
/** @typedef {import("../services/user-api-client.js").UserData} UserData */

/**
 * @typedef {Object} ServiceMap
 * @property {IUserApiClient} [legacy]
 * @property {IUserApiClient} [mock]
 * @property {IUserApiClient} [new]
 */
/**
 * @typedef {Object} ServiceControllerOptions
 * @property {ServiceMap} [services] - Map of service instances {legacy, mock, new}
 * @property {import('@lit/context').ContextProvider<any, any> | null} [profileProvider] - Profile context provider
 * @property {() => IUserApiClient|null} [getActiveService] - Function to get active service
 */

/**
 * ServiceController - Manages user service loading
 *
 * Handles:
 * - Service selection based on level and zone
 * - User data loading and error handling
 * - Profile context updates
 *
 * @implements {ReactiveController}
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
			...options,
		};

		this.userTask = new Task(host, {
			task: async ([service], { signal: _signal }) => {
				if (!service) return null;
				// ID is hardcoded to 1 as noted by user, currently only single user context exists.
				return service.fetchUserData(1);
			},
			args: () => [this.options.getActiveService?.() ?? null],
		});

		host.addController(this);
	}

	hostConnected() {}

	hostDisconnected() {}

	/**
	 * Called every time the task completes (successfully or error)
	 * or when the host updates. We sync the task state to the provider here.
	 */
	hostUpdate() {
		this.#updateProfileContext();
	}

	/**
	 * Update profile context with current task state
	 */
	#updateProfileContext() {
		if (!this.options.profileProvider) return;

		const status = this.userTask.status;
		const error = this.userTask.error;
		const value = this.userTask.value;

		this.options.profileProvider.setValue({
			name: value?.name,
			role: value?.role,
			loading: status === TaskStatus.PENDING || status === TaskStatus.INITIAL,
			error: error ? String(error) : null,
			serviceName: this.options.getActiveService?.()?.getServiceName(),
		});
	}

	/**
	 * Get active service based on service type and hot switch state
	 * @param {import('../services/user-api-client.js').ServiceType | string | null} serviceType - ServiceType from chapter data
	 * @param {import('../game/interfaces.js').HotSwitchState} hotSwitchState - Current zone state (for dynamic injection)
	 * @returns {IUserApiClient | null} Active service or null
	 */
	getActiveService(serviceType, hotSwitchState) {
		if (!serviceType) return null;

		// If service type is NEW (dynamic), check hotSwitchState
		if (serviceType === ServiceType.NEW) {
			if (hotSwitchState === HotSwitchStates.LEGACY)
				return this.options.services?.legacy ?? null;
			if (hotSwitchState === HotSwitchStates.NEW)
				return this.options.services?.new ?? null;
			return null; // Neutral zone - no service active
		}

		// Static service mapping
		if (serviceType === ServiceType.LEGACY)
			return this.options.services?.legacy ?? null;
		if (serviceType === ServiceType.MOCK)
			return this.options.services?.mock ?? null;

		return null;
	}
}
