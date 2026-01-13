import { TaskStatus } from "@lit/task";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceController } from "./service-controller.js";

describe("ServiceController", () => {
	/** @type {import("lit").ReactiveControllerHost} */
	let host;
	/** @type {ServiceController} */
	let controller;

	// Mock services
	/** @type {any} */
	let legacyService;
	/** @type {any} */
	let mockService;
	/** @type {any} */
	let newService;
	/** @type {any} */
	let profileProvider;

	beforeEach(() => {
		host = {
			addController: vi.fn(),
			removeController: vi.fn(),
			requestUpdate: vi.fn(),
			updateComplete: Promise.resolve(true),
		};

		// Mock services
		legacyService = {
			fetchUserData: vi.fn().mockResolvedValue({
				id: 1,
				name: "Legacy User",
				role: "developer",
				hp: 50,
				avatarColor: "#ef4444",
			}),
			getServiceName: vi.fn().mockReturnValue("legacy"),
		};

		mockService = {
			fetchUserData: vi.fn().mockResolvedValue({
				id: 2,
				name: "Mock User",
				role: "tester",
				hp: 75,
				avatarColor: "#eab308",
			}),
			getServiceName: vi.fn().mockReturnValue("mock"),
		};

		newService = {
			fetchUserData: vi.fn().mockResolvedValue({
				id: 3,
				name: "New User",
				role: "admin",
				hp: 100,
				avatarColor: "#22c55e",
			}),
			getServiceName: vi.fn().mockReturnValue("new"),
		};

		profileProvider = {
			setValue: vi.fn(),
		};
	});

	it("should initialize correctly", () => {
		controller = new ServiceController(host);
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.userTask).toBeDefined();
		expect(controller.userTask.status).toBe(TaskStatus.INITIAL);
	});

	describe("getActiveService", () => {
		beforeEach(() => {
			controller = new ServiceController(host, {
				services: { legacy: legacyService, mock: mockService, new: newService },
			});
		});

		it("should return legacy service for 'legacy' type", () => {
			const service = controller.getActiveService("legacy", null);
			expect(service).toBe(legacyService);
		});

		it("should return mock service for 'mock' type", () => {
			const service = controller.getActiveService("mock", null);
			expect(service).toBe(mockService);
		});

		it("should return legacy service for 'new' type with 'legacy' hotSwitch", () => {
			const service = controller.getActiveService("new", "legacy");
			expect(service).toBe(legacyService);
		});

		it("should return new service for 'new' type with 'new' hotSwitch", () => {
			const service = controller.getActiveService("new", "new");
			expect(service).toBe(newService);
		});

		it("should return null for 'new' type in neutral zone", () => {
			const service = controller.getActiveService("new", null);
			expect(service).toBeNull();
		});
	});

	describe("Task Execution (loadUserData replacement)", () => {
		beforeEach(() => {
			controller = new ServiceController(host, {
				services: { legacy: legacyService },
				profileProvider,
				getActiveService: () => legacyService,
			});
		});

		it("should fetch user data when service is active", async () => {
			// Trigger task update logic manually or wait for task if it auto-runs
			// @lit/task auto-runs when host updates or args change.
			// Since we just created it, and activeService returns legacyService, it should run.
			await controller.userTask.run();

			expect(legacyService.fetchUserData).toHaveBeenCalledWith(1);
			expect(controller.userTask.status).toBe(TaskStatus.COMPLETE);
			expect(controller.userTask.value).toEqual({
				id: 1,
				name: "Legacy User",
				role: "developer",
				hp: 50,
				avatarColor: "#ef4444",
			});
		});

		it("should update profile context and callback on success", async () => {
			await controller.userTask.run();

			// Emulate host update which calls hostUpdate()
			controller.hostUpdate();

			expect(profileProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Legacy User",
					loading: false,
					error: null,
					serviceName: "legacy",
				}),
			);
		});

		it("should handle errors", async () => {
			legacyService.fetchUserData.mockRejectedValue(new Error("Network error"));

			try {
				await controller.userTask.run();
			} catch (_e) {
				// Task run might reject
			}

			controller.hostUpdate();

			expect(controller.userTask.status).toBe(TaskStatus.ERROR);
			expect(profileProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Error: Network error",
					loading: false,
				}),
			);
		});
	});

	describe("updateProfileContext", () => {
		it("should update profile context with pending state", async () => {
			controller = new ServiceController(host, {
				profileProvider,
				getActiveService: () => legacyService,
			});

			// We need to trick the task into pending state or just check initial
			expect(controller.userTask.status).toBe(TaskStatus.INITIAL);

			// Manually call private method wrapper if it was public...
			// Since it's private called by hostUpdate, we call hostUpdate
			controller.hostUpdate();

			expect(profileProvider.setValue).toHaveBeenCalledWith(
				expect.objectContaining({
					loading: true, // INITIAL is considered loading in our logic
					error: null,
				}),
			);
		});
	});
});
