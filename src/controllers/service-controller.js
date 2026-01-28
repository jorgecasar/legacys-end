import { ContextConsumer } from "@lit/context";
import { Task, TaskStatus } from "@lit/task";
import { apiClientsContext } from "../contexts/api-clients-context.js";
import { questControllerContext } from "../contexts/quest-controller-context.js";
import { HotSwitchStates } from "../core/constants.js";
import { heroStateContext } from "../game/contexts/hero-context.js";
import { ServiceType } from "../services/user-api-client.js";

/**
 * @typedef {import('lit').ReactiveController} ReactiveController
 * @typedef {import('lit').ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import('lit').ReactiveElement} ReactiveElement
 */

/** @typedef {import("../services/user-api-client.js").IUserApiClient} IUserApiClient */
/** @typedef {import("../services/user-api-client.js").UserData} UserData */
/** @typedef {import("../contexts/api-clients-context.js").UserApiClients} UserApiClients */

/**
 * @typedef {import('../game/interfaces.js').IHeroStateService} IHeroStateService
 * @typedef {import('../services/interfaces.js').IQuestController} IQuestController
 */

/**
 * @typedef {import("lit").ReactiveElement & { profileProvider: import('@lit/context').ContextProvider<any, any> | null }} HostWithProfileProvider
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
	/** @type {IHeroStateService | null} */
	#heroState = null;
	/** @type {IQuestController | null} */
	#questController = null;
	/** @type {UserApiClients | null} */
	#apiClients = null;

	/**
	 * @param {ReactiveControllerHost} host
	 */
	constructor(host) {
		/** @type {ReactiveControllerHost} */
		this.host = host;

		const hostElement = /** @type {ReactiveElement} */ (
			/** @type {unknown} */ (this.host)
		);

		// Initialize Context Consumers
		new ContextConsumer(hostElement, {
			context: heroStateContext,
			subscribe: true,
			callback: (service) => {
				this.#heroState = /** @type {IHeroStateService} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: questControllerContext,
			subscribe: true,
			callback: (service) => {
				this.#questController = /** @type {IQuestController} */ (service);
			},
		});

		new ContextConsumer(hostElement, {
			context: apiClientsContext,
			subscribe: true,
			callback: (services) => {
				this.#apiClients = /** @type {UserApiClients} */ (services);
			},
		});

		this.userTask = new Task(host, {
			task: async ([service], { signal: _signal }) => {
				if (!service) return null;
				// ID is hardcoded to 1 as noted by user, currently only single user context exists.
				return service.fetchUserData(1);
			},
			args: () => {
				const hotSwitchState = this.#heroState?.hotSwitchState.get();
				const serviceType = this.#questController?.currentChapter?.serviceType;
				return [this.getActiveService(serviceType, hotSwitchState)];
			},
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
		const host = /** @type {HostWithProfileProvider} */ (
			/** @type {unknown} */ (this.host)
		);

		if (!host.profileProvider) return;

		const status = this.userTask.status;
		const error = this.userTask.error;
		const value = this.userTask.value;

		const activeService = this.getActiveService(
			this.#questController?.currentChapter?.serviceType,
			this.#heroState?.hotSwitchState.get(),
		);

		host.profileProvider.setValue({
			name: value?.name,
			role: value?.role,
			loading: status === TaskStatus.PENDING || status === TaskStatus.INITIAL,
			error: error ? String(error) : null,
			serviceName: activeService?.getServiceName(),
		});
	}

	/**
	 * Get active service based on service type and hot switch state
	 * @param {import('../services/user-api-client.js').ServiceType | string | null | undefined} serviceType - ServiceType from chapter data
	 * @param {import('../game/interfaces.js').HotSwitchState | undefined} hotSwitchState - Current zone state (for dynamic injection)
	 * @returns {IUserApiClient | null} Active service or null
	 */
	getActiveService(serviceType, hotSwitchState) {
		if (!serviceType) return null;

		// If service type is NEW (dynamic), check hotSwitchState
		if (serviceType === ServiceType.NEW) {
			if (hotSwitchState === HotSwitchStates.LEGACY)
				return this.#apiClients?.legacy ?? null;
			if (hotSwitchState === HotSwitchStates.NEW)
				return this.#apiClients?.new ?? null;
			return null; // Neutral zone - no service active
		}

		// Static service mapping
		if (serviceType === ServiceType.LEGACY)
			return this.#apiClients?.legacy ?? null;
		if (serviceType === ServiceType.MOCK) return this.#apiClients?.mock ?? null;

		return null;
	}
}
