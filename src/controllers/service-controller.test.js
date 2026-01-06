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
	/** @type {any} */
	let onDataLoaded;
	/** @type {any} */
	let onError;

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

		onDataLoaded = vi.fn();
		onError = vi.fn();
	});

	it("should initialize correctly", () => {
		controller = new ServiceController(host);
		expect(host.addController).toHaveBeenCalledWith(controller);
		expect(controller.userData).toBeNull();
		expect(controller.userLoading).toBe(false);
		expect(controller.userError).toBeNull();
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

		it("should return null for unknown service type", () => {
			const service = controller.getActiveService("unknown", null);
			expect(service).toBeNull();
		});

		it("should return null if serviceType is null", () => {
			const service = controller.getActiveService(null, null);
			expect(service).toBeNull();
		});
	});

	describe("loadUserData", () => {
		beforeEach(() => {
			controller = new ServiceController(host, {
				services: { legacy: legacyService },
				profileProvider,
				getActiveService: () => legacyService,
				onDataLoaded,
				onError,
			});
		});

		it("should load user data successfully", async () => {
			await controller.loadUserData();

			expect(legacyService.fetchUserData).toHaveBeenCalledWith(1);
			expect(controller.userData).toEqual({
				id: 1,
				name: "Legacy User",
				role: "developer",
				hp: 50,
				avatarColor: "#ef4444",
			});
			expect(controller.userLoading).toBe(false);
			expect(controller.userError).toBeNull();
			expect(onDataLoaded).toHaveBeenCalledWith(controller.userData);
			expect(profileProvider.setValue).toHaveBeenCalled();
		});

		it("should handle errors during loading", async () => {
			legacyService.fetchUserData.mockRejectedValue(new Error("Network error"));

			await controller.loadUserData();

			expect(controller.userData).toBeNull();
			expect(controller.userLoading).toBe(false);
			expect(controller.userError).toBe("Network error");
			expect(onError).toHaveBeenCalledWith("Network error");
			expect(profileProvider.setValue).toHaveBeenCalled();
		});

		it("should set loading state during fetch", async () => {
			let loadingDuringFetch = false;
			legacyService.fetchUserData.mockImplementation(async () => {
				loadingDuringFetch = controller.userLoading;
				return {
					id: 1,
					name: "Test",
					role: "user",
					hp: 50,
					avatarColor: "#ef4444",
				};
			});

			await controller.loadUserData();

			expect(loadingDuringFetch).toBe(true);
			expect(controller.userLoading).toBe(false);
		});

		it("should do nothing if no active service", async () => {
			controller.options.getActiveService = () => null;

			await controller.loadUserData();

			expect(controller.userData).toBeNull();
			expect(onDataLoaded).not.toHaveBeenCalled();
		});
	});

	describe("updateProfileContext", () => {
		beforeEach(() => {
			controller = new ServiceController(host, {
				services: { legacy: legacyService },
				profileProvider,
				getActiveService: () => legacyService,
			});
		});

		it("should update profile context with user data", () => {
			controller.userData = {
				id: 1,
				name: "Test User",
				role: "admin",
				hp: 100,
				avatarColor: "#22c55e",
			};
			controller.userLoading = false;
			controller.userError = null;

			controller.updateProfileContext();

			expect(profileProvider.setValue).toHaveBeenCalledWith({
				name: "Test User",
				role: "admin",
				loading: false,
				error: null,
				serviceName: "legacy",
			});
		});

		it("should do nothing if no profileProvider", () => {
			controller.options.profileProvider = null;
			controller.updateProfileContext();
			// Should not throw
		});
	});

	describe("Getters", () => {
		beforeEach(() => {
			controller = new ServiceController(host);
		});

		it("getUserData should return current userData", () => {
			controller.userData = {
				id: 1,
				name: "Test",
				role: "user",
				hp: 50,
				avatarColor: "#ef4444",
			};
			expect(controller.getUserData()).toEqual({
				id: 1,
				name: "Test",
				role: "user",
				hp: 50,
				avatarColor: "#ef4444",
			});
		});

		it("isLoading should return current loading state", () => {
			controller.userLoading = true;
			expect(controller.isLoading()).toBe(true);
		});

		it("getError should return current error", () => {
			controller.userError = "Test error";
			expect(controller.getError()).toBe("Test error");
		});
	});
});
