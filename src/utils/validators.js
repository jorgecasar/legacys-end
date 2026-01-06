/**
 * Validation utilities for game inputs
 *
 * Provides validators for common game data types to ensure
 * data integrity and prevent invalid states.
 */

import { Result } from "./result.js";

/**
 * @typedef {Object} ValidationError
 * @property {string} field - The field that failed validation
 * @property {string} message - The error message
 * @property {any} value - The invalid value
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {ValidationError[]} errors - List of validation errors
 */

/**
 * Position Validator - Validates hero/NPC positions
 */
export class PositionValidator {
	/**
	 * Validate a position coordinate
	 * @param {number} x - X coordinate (0-100)
	 * @param {number} y - Y coordinate (0-100)
	 * @returns {ValidationResult}
	 */
	static validate(x, y) {
		const errors = [];

		if (typeof x !== "number" || Number.isNaN(x)) {
			errors.push({
				field: "x",
				message: "X must be a number",
				value: x,
			});
		} else if (x < 0 || x > 100) {
			errors.push({
				field: "x",
				message: "X must be between 0 and 100",
				value: x,
			});
		}

		if (typeof y !== "number" || Number.isNaN(y)) {
			errors.push({
				field: "y",
				message: "Y must be a number",
				value: y,
			});
		} else if (y < 0 || y > 100) {
			errors.push({
				field: "y",
				message: "Y must be between 0 and 100",
				value: y,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate and return Result
	 * @param {number} x
	 * @param {number} y
	 * @returns {Result<{x: number, y: number}, ValidationError[]>}
	 */
	static validateResult(x, y) {
		const validation = PositionValidator.validate(x, y);
		if (validation.isValid) {
			return Result.Ok({ x, y });
		}
		return Result.Err(validation.errors);
	}
}

/**
 * Theme Mode Validator
 */
export class ThemeModeValidator {
	static VALID_MODES = ["light", "dark"];

	/**
	 * Validate theme mode
	 * @param {string} mode
	 * @returns {ValidationResult}
	 */
	static validate(mode) {
		const errors = [];

		if (typeof mode !== "string") {
			errors.push({
				field: "themeMode",
				message: "Theme mode must be a string",
				value: mode,
			});
		} else if (!ThemeModeValidator.VALID_MODES.includes(mode)) {
			errors.push({
				field: "themeMode",
				message: `Theme mode must be one of: ${ThemeModeValidator.VALID_MODES.join(", ")}`,
				value: mode,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate and return Result
	 * @param {string} mode
	 * @returns {Result<string, ValidationError[]>}
	 */
	static validateResult(mode) {
		const validation = ThemeModeValidator.validate(mode);
		if (validation.isValid) {
			return Result.Ok(mode);
		}
		return Result.Err(validation.errors);
	}
}

/**
 * Hot Switch State Validator
 */
export class HotSwitchStateValidator {
	static VALID_STATES = ["legacy", "new", "test", null];

	/**
	 * Validate hot switch state
	 * @param {string | null} state
	 * @returns {ValidationResult}
	 */
	static validate(state) {
		const errors = [];

		if (state !== null && typeof state !== "string") {
			errors.push({
				field: "hotSwitchState",
				message: "Hot switch state must be a string or null",
				value: state,
			});
		} else if (!HotSwitchStateValidator.VALID_STATES.includes(state)) {
			errors.push({
				field: "hotSwitchState",
				message: `Hot switch state must be one of: ${HotSwitchStateValidator.VALID_STATES.filter((s) => s !== null).join(", ")} or null`,
				value: state,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate and return Result
	 * @param {string | null} state
	 * @returns {Result<string | null, ValidationError[]>}
	 */
	static validateResult(state) {
		const validation = HotSwitchStateValidator.validate(state);
		if (validation.isValid) {
			return Result.Ok(state);
		}
		return Result.Err(validation.errors);
	}
}

/**
 * Quest ID Validator
 */
export class QuestIdValidator {
	/**
	 * Validate quest ID format
	 * @param {string} questId
	 * @returns {ValidationResult}
	 */
	static validate(questId) {
		const errors = [];

		if (typeof questId !== "string") {
			errors.push({
				field: "questId",
				message: "Quest ID must be a string",
				value: questId,
			});
		} else if (questId.trim().length === 0) {
			errors.push({
				field: "questId",
				message: "Quest ID cannot be empty",
				value: questId,
			});
		} else if (!/^[a-z0-9-]+$/.test(questId)) {
			errors.push({
				field: "questId",
				message:
					"Quest ID must contain only lowercase letters, numbers, and hyphens",
				value: questId,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate and return Result
	 * @param {string} questId
	 * @returns {Result<string, ValidationError[]>}
	 */
	static validateResult(questId) {
		const validation = QuestIdValidator.validate(questId);
		if (validation.isValid) {
			return Result.Ok(questId);
		}
		return Result.Err(validation.errors);
	}
}

/**
 * Generic validator for combining multiple validations
 */
export class CompositeValidator {
	/**
	 * Combine multiple validation results
	 * @param {...ValidationResult} validations
	 * @returns {ValidationResult}
	 */
	static combine(...validations) {
		const allErrors = validations.flatMap((v) => v.errors);
		return {
			isValid: allErrors.length === 0,
			errors: allErrors,
		};
	}

	/**
	 * Validate an object against a schema
	 * @param {Record<string, any>} obj - Object to validate
	 * @param {Object<string, (value: any) => ValidationResult>} schema - Validation schema
	 * @returns {ValidationResult}
	 */
	static validateObject(obj, schema) {
		const errors = [];

		for (const [key, validator] of Object.entries(schema)) {
			const value = obj[key];
			const result = validator(value);
			if (!result.isValid) {
				errors.push(...result.errors);
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
