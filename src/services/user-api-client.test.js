import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceType } from "../content/quests/quest-types.js";
import {
	LegacyUserApiClient,
	MockUserApiClient,
	NewUserApiClient,
} from "./user-api-client.js";

describe("UserApiClients", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("LegacyUserApiClient", () => {
		it("should return LEGACY service name", () => {
			const client = new LegacyUserApiClient();
			expect(client.getServiceName()).toBe(ServiceType.LEGACY);
		});

		it("should fetch user data after delay", async () => {
			const client = new LegacyUserApiClient();
			const promise = client.fetchUserData(123);

			vi.advanceTimersByTime(500);

			const data = await promise;
			expect(data).toEqual({
				id: 123,
				name: "Alarion V1",
				role: "Monolith Dweller",
				hp: 50,
				avatarColor: "#ef4444",
			});
		});
	});

	describe("MockUserApiClient", () => {
		it("should return MOCK service name", () => {
			const client = new MockUserApiClient();
			expect(client.getServiceName()).toBe(ServiceType.MOCK);
		});

		it("should fetch user data after delay", async () => {
			const client = new MockUserApiClient();
			const promise = client.fetchUserData(456);

			vi.advanceTimersByTime(500);

			const data = await promise;
			expect(data).toEqual({
				id: 456,
				name: "Test Dummy",
				role: "QA Subject",
				hp: 9999,
				avatarColor: "#eab308",
			});
		});
	});

	describe("NewUserApiClient", () => {
		it("should return NEW service name", () => {
			const client = new NewUserApiClient();
			expect(client.getServiceName()).toBe(ServiceType.NEW);
		});

		it("should fetch user data after delay", async () => {
			const client = new NewUserApiClient();
			const promise = client.fetchUserData(789);

			vi.advanceTimersByTime(500);

			const data = await promise;
			expect(data).toEqual({
				id: 789,
				name: "Alarion V2",
				role: "System Walker",
				hp: 100,
				avatarColor: "#22c55e",
			});
		});
	});
});
