import { describe, expect, it, vi } from "vitest";
import {
	getAllQuests,
	getAvailableQuests,
	getComingSoonQuests,
	getQuest,
	isQuestLocked,
} from "./quest-registry-service.js";

vi.mock("../content/quests/quests-data.js", () => {
	const mockQuests = {
		"quest-1": {
			id: "quest-1",
			name: "First Quest",
			prerequisites: [],
			status: "available",
		},
		"quest-2": {
			id: "quest-2",
			name: "Second Quest",
			prerequisites: ["quest-1"],
			status: "available",
		},
		"quest-3": {
			id: "quest-3",
			name: "Third Quest",
			prerequisites: ["quest-1", "quest-2"],
			status: "available",
		},
		"quest-coming-soon": {
			id: "quest-coming-soon",
			name: "Coming Soon Quest",
			prerequisites: [],
			status: "coming-soon",
		},
	};

	return {
		getQuests: vi.fn().mockReturnValue(mockQuests),
		QUESTS: mockQuests,
		loadQuest: vi
			.fn()
			.mockImplementation((id) =>
				Promise.resolve(id === "non-existent" ? undefined : { id }),
			),
	};
});

describe("Quest Registry Service", () => {
	describe("getQuest", () => {
		it("should return quest by ID", () => {
			const quest = getQuest("quest-1");
			expect(quest).toBeDefined();
			expect(quest?.id).toBe("quest-1");
			expect(quest?.name).toBe("First Quest");
		});

		it("should return undefined for non-existent quest", () => {
			const quest = getQuest("non-existent");
			expect(quest).toBeUndefined();
		});
	});

	describe("getAllQuests", () => {
		it("should return all quests", () => {
			const quests = getAllQuests();
			expect(quests).toHaveLength(4);
			expect(quests.map((q) => q.id)).toContain("quest-1");
			expect(quests.map((q) => q.id)).toContain("quest-2");
			expect(quests.map((q) => q.id)).toContain("quest-3");
			expect(quests.map((q) => q.id)).toContain("quest-coming-soon");
		});

		it("should return array of quest objects", () => {
			const quests = getAllQuests();
			quests.forEach((quest) => {
				expect(quest).toHaveProperty("id");
				expect(quest).toHaveProperty("name");
				expect(quest).toHaveProperty("prerequisites");
				expect(quest).toHaveProperty("status");
			});
		});
	});

	describe("isQuestLocked", () => {
		it("should return false for quest with no prerequisites", () => {
			const locked = isQuestLocked("quest-1", []);
			expect(locked).toBe(false);
		});

		it("should return false when all prerequisites are completed", () => {
			const locked = isQuestLocked("quest-2", ["quest-1"]);
			expect(locked).toBe(false);
		});

		it("should return true when prerequisites are not completed", () => {
			const locked = isQuestLocked("quest-2", []);
			expect(locked).toBe(true);
		});

		it("should return true when some prerequisites are missing", () => {
			const locked = isQuestLocked("quest-3", ["quest-1"]);
			expect(locked).toBe(true);
		});

		it("should return false when all multiple prerequisites are completed", () => {
			const locked = isQuestLocked("quest-3", ["quest-1", "quest-2"]);
			expect(locked).toBe(false);
		});

		it("should return false for non-existent quest", () => {
			const locked = isQuestLocked("non-existent", []);
			expect(locked).toBe(false);
		});
	});

	describe("getAvailableQuests", () => {
		it("should return only available quests", () => {
			const quests = getAvailableQuests();
			expect(quests).toHaveLength(3);
			expect(quests.map((q) => q.id)).toContain("quest-1");
			expect(quests.map((q) => q.id)).toContain("quest-2");
			expect(quests.map((q) => q.id)).toContain("quest-3");
			expect(quests.map((q) => q.id)).not.toContain("quest-coming-soon");
		});

		it("should exclude coming-soon quests", () => {
			const quests = getAvailableQuests();
			quests.forEach((quest) => {
				expect(quest.status).not.toBe("coming-soon");
			});
		});

		it("should accept completedQuests parameter (currently unused)", () => {
			const quests = getAvailableQuests(["quest-1"]);
			expect(quests).toHaveLength(3);
		});
	});

	describe("getComingSoonQuests", () => {
		it("should return only coming-soon quests", () => {
			const quests = getComingSoonQuests();
			expect(quests).toHaveLength(1);
			expect(quests[0].id).toBe("quest-coming-soon");
			expect(quests[0].status).toBe("coming-soon");
		});

		it("should exclude available quests", () => {
			const quests = getComingSoonQuests();
			expect(quests.map((q) => q.id)).not.toContain("quest-1");
			expect(quests.map((q) => q.id)).not.toContain("quest-2");
			expect(quests.map((q) => q.id)).not.toContain("quest-3");
		});
	});
});
