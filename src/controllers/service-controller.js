import { Task, TaskStatus } from "@lit/task";
import { ServiceType } from "../content/quests/quest-types.js";
import { HotSwitchStates } from "../core/constants.js";

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
 * @typedef {import('../contexts/profile-context.js').Profile} Profile
 * @typedef {ReactiveControllerHost & { profile: Profile }} HostWithProfile
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
	 * @param {HostWithProfile} host
	 * @param {object} dependencies
	 * @param {IHeroStateService} dependencies.heroState
	 * @param {IQuestController} dependencies.questController
	 * @param {UserApiClients} dependencies.apiClients
	 */
	constructor(host, { heroState, questController, apiClients }) {
		/** @type {HostWithProfile} */
		this.host = host;

		// Store injected dependencies
		this.#heroState = heroState;
		this.#questController = questController;
		this.#apiClients = apiClients;

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
		const activeService = this.getActiveService(
			this.#questController?.currentChapter?.serviceType,
			this.#heroState?.hotSwitchState.get(),
		);

		const { status, error, value } = this.userTask;

		/** @type {import('../contexts/profile-context.js').Profile} */
		const profile = {
			loading: status === TaskStatus.PENDING || status === TaskStatus.INITIAL,
			error: error ? String(error) : null,
		};

		if (value?.name) profile.name = value.name;
		if (value?.role) profile.role = value.role;
		const serviceName = activeService?.getServiceName();
		if (serviceName) profile.serviceName = serviceName;

		this.host.profile = profile;
	}

	/**
	 * Get active service based on service type and hot switch state
	 * @param {import('../content/quests/quest-types.js').ServiceType | string | null | undefined} serviceType - ServiceType from chapter data
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
