import { describe, expect, it } from "vitest";
import {
	GameConstants,
	HotSwitchStates,
	ThemeModes,
} from "../core/constants.js";
import {
	CompositeValidator,
	HotSwitchStateValidator,
	PositionValidator,
	QuestIdValidator,
	ThemeModeValidator,
} from "./validators.js";

describe("PositionValidator", () => {
	it("should validate valid positions", () => {
		const result = PositionValidator.validate(50, 50);
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should reject negative x", () => {
		const result = PositionValidator.validate(-1, 50);
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]?.field).toBe("x");
	});

	it("should reject x > MAX_POS", () => {
		const result = PositionValidator.validate(GameConstants.MAX_POS + 1, 50);
		expect(result.isValid).toBe(false);
		expect(result.errors[0]?.field).toBe("x");
	});

	it("should reject non-number x", () => {
		const result = PositionValidator.validate(/** @type {any} */ ("50"), 50);
		expect(result.isValid).toBe(false);
		expect(result.errors[0]?.field).toBe("x");
	});

	it("should reject NaN", () => {
		const result = PositionValidator.validate(Number.NaN, 50);
		expect(result.isValid).toBe(false);
	});

	it("should validate both coordinates", () => {
		const result = PositionValidator.validate(-1, 101);
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(2);
	});

	it("should return Result.Ok for valid position", () => {
		const result = PositionValidator.validateResult(50, 75);
		expect(result.isSuccess).toBe(true);
		expect(result.value).toEqual({ x: 50, y: 75 });
	});

	it("should return Result.Err for invalid position", () => {
		const result = PositionValidator.validateResult(-1, 50);
		expect(result.isFailure).toBe(true);
		expect(result.error).toHaveLength(1);
	});
});

describe("ThemeModeValidator", () => {
	it("should validate 'light' theme", () => {
		const result = ThemeModeValidator.validate(ThemeModes.LIGHT);
		expect(result.isValid).toBe(true);
	});

	it("should validate 'dark' theme", () => {
		const result = ThemeModeValidator.validate(ThemeModes.DARK);
		expect(result.isValid).toBe(true);
	});

	it("should reject invalid theme", () => {
		const result = ThemeModeValidator.validate("blue");
		expect(result.isValid).toBe(false);
		expect(result.errors[0]?.field).toBe("themeMode");
	});

	it("should reject non-string theme", () => {
		const result = ThemeModeValidator.validate(/** @type {any} */ (123));
		expect(result.isValid).toBe(false);
	});

	it("should return Result for valid theme", () => {
		const result = ThemeModeValidator.validateResult(ThemeModes.DARK);
		expect(result.isSuccess).toBe(true);
		expect(result.value).toBe(ThemeModes.DARK);
	});
});

describe("HotSwitchStateValidator", () => {
	it("should validate 'legacy' state", () => {
		const result = HotSwitchStateValidator.validate(HotSwitchStates.LEGACY);
		expect(result.isValid).toBe(true);
	});

	it("should validate 'new' state", () => {
		const result = HotSwitchStateValidator.validate(HotSwitchStates.NEW);
		expect(result.isValid).toBe(true);
	});

	it("should validate 'mock' state", () => {
		const result = HotSwitchStateValidator.validate(HotSwitchStates.MOCK);
		expect(result.isValid).toBe(true);
	});

	it("should validate null state", () => {
		const result = HotSwitchStateValidator.validate(null);
		expect(result.isValid).toBe(true);
	});

	it("should reject invalid state", () => {
		const result = HotSwitchStateValidator.validate("invalid");
		expect(result.isValid).toBe(false);
	});

	it("should reject non-string non-null state", () => {
		const result = HotSwitchStateValidator.validate(/** @type {any} */ (123));
		expect(result.isValid).toBe(false);
	});

	it("should return Result for valid state", () => {
		const result = HotSwitchStateValidator.validateResult(HotSwitchStates.NEW);
		expect(result.isSuccess).toBe(true);
		expect(result.value).toBe(HotSwitchStates.NEW);
	});
});

describe("QuestIdValidator", () => {
	it("should validate valid quest ID", () => {
		const result = QuestIdValidator.validate("the-aura-of-sovereignty");
		expect(result.isValid).toBe(true);
	});

	it("should validate quest ID with numbers", () => {
		const result = QuestIdValidator.validate("quest-123");
		expect(result.isValid).toBe(true);
	});

	it("should reject empty quest ID", () => {
		const result = QuestIdValidator.validate("");
		expect(result.isValid).toBe(false);
	});

	it("should reject quest ID with spaces", () => {
		const result = QuestIdValidator.validate("quest 123");
		expect(result.isValid).toBe(false);
	});

	it("should reject quest ID with uppercase", () => {
		const result = QuestIdValidator.validate("Quest-123");
		expect(result.isValid).toBe(false);
	});

	it("should reject non-string quest ID", () => {
		const result = QuestIdValidator.validate(/** @type {any} */ (123));
		expect(result.isValid).toBe(false);
	});

	it("should return Result for valid quest ID", () => {
		const result = QuestIdValidator.validateResult("test-quest");
		expect(result.isSuccess).toBe(true);
		expect(result.value).toBe("test-quest");
	});
});

describe("CompositeValidator", () => {
	it("should combine multiple valid validations", () => {
		const v1 = { isValid: true, errors: [] };
		const v2 = { isValid: true, errors: [] };
		const result = CompositeValidator.combine(v1, v2);
		expect(result.isValid).toBe(true);
	});

	it("should combine validations with errors", () => {
		const v1 = {
			isValid: false,
			errors: [{ field: "x", message: "Invalid", value: -1 }],
		};
		const v2 = {
			isValid: false,
			errors: [{ field: "y", message: "Invalid", value: 101 }],
		};
		const result = CompositeValidator.combine(v1, v2);
		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(2);
	});

	it("should validate object against schema", () => {
		const obj = { x: 50, y: 75, theme: ThemeModes.DARK };
		const schema = {
			x: /** @param {any} v */ (v) => PositionValidator.validate(v, 0),
			y: /** @param {any} v */ (v) => PositionValidator.validate(0, v),
			theme: ThemeModeValidator.validate.bind(ThemeModeValidator),
		};

		const result = CompositeValidator.validateObject(obj, schema);
		expect(result.isValid).toBe(true);
	});

	it("should collect errors from object validation", () => {
		const obj = { x: -1, theme: "invalid" };
		const schema = {
			x: /** @param {any} v */ (v) => PositionValidator.validate(v, 0),
			theme: ThemeModeValidator.validate.bind(ThemeModeValidator),
		};

		const result = CompositeValidator.validateObject(obj, schema);
		expect(result.isValid).toBe(false);
		expect(result.errors.length).toBe(2); // One for x, one for theme
	});
});
