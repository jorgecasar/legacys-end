import { ServiceType } from "../types.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class LegacyUserService {
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
	getServiceName() {
		return ServiceType.LEGACY;
	}
}

export class MockUserService {
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
	getServiceName() {
		return ServiceType.MOCK;
	}
}

export class NewUserService {
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
	getServiceName() {
		return ServiceType.NEW;
	}
}
