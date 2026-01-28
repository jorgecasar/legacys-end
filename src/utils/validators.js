/**
 * Validation utilities for game inputs
 *
 * Provides validators for common game data types to ensure
 * data integrity and prevent invalid states.
 */

import {
	GameConstants,
	HotSwitchStates,
	ThemeModes,
} from "../core/constants.js";
import { Result } from "./result.js";

/**
 * @typedef {Object} ValidationError
 * @property {string} field - The field that failed validation
 * @property {string} message - The error message
 * @property {unknown} value - The invalid value
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {ValidationError[]} errors - List of validation errors
 */

/**
 * Helper to create a ValidationResult
 * @param {ValidationError[]} errors
 * @returns {ValidationResult}
 */
const createValidationResult = (errors) => ({
	isValid: errors.length === 0,
	errors,
});

/**
 * Helper to convert a ValidationResult to a Result
 * @template T
 * @param {ValidationResult} validation
 * @param {T} value
 * @returns {Result<T, ValidationError[]>}
 */
const toResult = (validation, value) => {
	if (validation.isValid) {
		return /** @type {Result<T, ValidationError[]>} */ (
			/** @type {unknown} */ (Result.Ok(value))
		);
	}
	return /** @type {Result<T, ValidationError[]>} */ (
		Result.Err(validation.errors)
	);
};

/**
 * Position Validator - Validates hero/NPC positions
 */
export const PositionValidator = {
	/**
	 * Validate a position coordinate
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @returns {ValidationResult}
	 */
	validate(x, y) {
		const errors = [];

		if (typeof x !== "number" || Number.isNaN(x)) {
			errors.push({
				field: "x",
				message: "X must be a number",
				value: x,
			});
		} else if (x < GameConstants.MIN_POS || x > GameConstants.MAX_POS) {
			errors.push({
				field: "x",
				message: `X must be between ${GameConstants.MIN_POS} and ${GameConstants.MAX_POS}`,
				value: x,
			});
		}

		if (typeof y !== "number" || Number.isNaN(y)) {
			errors.push({
				field: "y",
				message: "Y must be a number",
				value: y,
			});
		} else if (y < GameConstants.MIN_POS || y > GameConstants.MAX_POS) {
			errors.push({
				field: "y",
				message: `Y must be between ${GameConstants.MIN_POS} and ${GameConstants.MAX_POS}`,
				value: y,
			});
		}

		return createValidationResult(errors);
	},

	/**
	 * Validate position and return Result
	 * @param {number} x
	 * @param {number} y
	 * @returns {Result<{x: number, y: number}, ValidationError[]>}
	 */
	validateResult(x, y) {
		return toResult(this.validate(x, y), { x, y });
	},
};

/**
 * Theme Mode Validator
 */
export const ThemeModeValidator = {
	VALID_MODES: Object.values(ThemeModes),

	/**
	 * @typedef {import('../core/constants.js').ThemeMode} ThemeMode
	 */

	/**
	 * Validate theme mode
	 * @param {unknown} mode
	 * @returns {ValidationResult}
	 */
	validate(mode) {
		const errors = [];

		if (typeof mode !== "string") {
			errors.push({
				field: "themeMode",
				message: "Theme mode must be a string",
				value: mode,
			});
		} else if (!this.VALID_MODES.includes(mode)) {
			errors.push({
				field: "themeMode",
				message: `Theme mode must be one of: ${this.VALID_MODES.join(", ")}`,
				value: mode,
			});
		}

		return createValidationResult(errors);
	},

	/**
	 * Validate theme mode and return Result
	 * @param {ThemeMode} mode
	 * @returns {Result<ThemeMode, ValidationError[]>}
	 */
	validateResult(mode) {
		return toResult(this.validate(mode), mode);
	},
};

/**
 * Hot Switch State Validator
 */
export const HotSwitchStateValidator = {
	VALID_STATES: [...Object.values(HotSwitchStates), null],

	/**
	 * @typedef {import('../game/interfaces.js').HotSwitchState} HotSwitchState
	 */

	/**
	 * Validate hot switch state
	 * @param {unknown} state
	 * @returns {ValidationResult}
	 */
	validate(state) {
		const errors = [];

		if (state !== null && typeof state !== "string") {
			errors.push({
				field: "hotSwitchState",
				message: "Hot switch state must be a string or null",
				value: state,
			});
		} else if (!this.VALID_STATES.includes(state)) {
			errors.push({
				field: "hotSwitchState",
				message: `Hot switch state must be one of: ${this.VALID_STATES.filter((s) => s !== null).join(", ")} or null`,
				value: state,
			});
		}

		return createValidationResult(errors);
	},

	/**
	 * Validate hot switch state and return Result
	 * @param {HotSwitchState} state
	 * @returns {Result<HotSwitchState, ValidationError[]>}
	 */
	validateResult(state) {
		return toResult(this.validate(state), state);
	},
};

/**
 * Quest ID Validator
 */
export const QuestIdValidator = {
	/**
	 * Validate quest ID format
	 * @param {string} questId
	 * @returns {ValidationResult}
	 */
	validate(questId) {
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

		return createValidationResult(errors);
	},

	/**
	 * Validate quest ID and return Result
	 * @param {string} questId
	 * @returns {Result<string, ValidationError[]>}
	 */
	validateResult(questId) {
		return toResult(this.validate(questId), questId);
	},
};

/**
 * Generic validator for combining multiple validations
 */
export const CompositeValidator = {
	/**
	 * Combine multiple validation results
	 * @param {...ValidationResult} validations
	 * @returns {ValidationResult}
	 */
	combine(...validations) {
		const allErrors = validations.flatMap((v) => v.errors);
		return createValidationResult(allErrors);
	},

	/**
	 * Validate an object against a schema
	 * @param {Record<string, unknown>} obj - Object to validate
	 * @param {Record<string, (value: unknown) => ValidationResult>} schema - Validation schema
	 * @returns {ValidationResult}
	 */
	validateObject(obj, schema) {
		const errors = [];

		for (const [key, validator] of Object.entries(schema)) {
			const value = obj[key];
			const result = validator(value);
			if (!result.isValid) {
				errors.push(...result.errors);
			}
		}

		return createValidationResult(errors);
	},
};
