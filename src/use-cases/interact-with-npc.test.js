import { describe, expect, it } from "vitest";
import { InteractWithNpcUseCase } from "./interact-with-npc.js";

describe("InteractWithNpcUseCase", () => {
	const useCase = new InteractWithNpcUseCase();

	it("should return action 'none' if not close", () => {
		const result = useCase.execute({
			isClose: false,
			chapterData: {},
			hotSwitchState: "new",
			hasCollectedItem: false,
		});

		expect(result.action).toBe("none");
		expect(result.success).toBe(false);
	});

	it("should return action 'showDialog' for regular interaction if item not collected", () => {
		const result = useCase.execute({
			isClose: true,
			chapterData: { isFinalBoss: false },
			hotSwitchState: "legacy",
			hasCollectedItem: false,
		});

		expect(result.action).toBe("showDialog");
		expect(result.success).toBe(true);
	});

	it("should return action 'none' for regular interaction if item already collected", () => {
		const result = useCase.execute({
			isClose: true,
			chapterData: { isFinalBoss: false },
			hotSwitchState: "new",
			hasCollectedItem: true,
		});

		expect(result.action).toBe("none");
		expect(result.success).toBe(false);
	});

	it("should return action 'showDialog' for final boss if hotSwitchState is 'new'", () => {
		const result = useCase.execute({
			isClose: true,
			chapterData: { isFinalBoss: true },
			hotSwitchState: "new",
			hasCollectedItem: false,
		});

		expect(result.action).toBe("showDialog");
		expect(result.success).toBe(true);
	});

	it("should return action 'showLocked' for final boss if hotSwitchState is 'legacy'", () => {
		const result = useCase.execute({
			isClose: true,
			chapterData: { isFinalBoss: true },
			hotSwitchState: "legacy",
			hasCollectedItem: false,
		});

		expect(result.action).toBe("showLocked");
		expect(result.message).toBe("REQ: NEW API");
		expect(result.success).toBe(false);
	});
});
