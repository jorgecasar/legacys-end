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
 * @typedef {import('../types/services.d.js').ThemeMode} ThemeMode
 * @typedef {import('../types/game.d.js').HotSwitchState} HotSwitchState
 * @typedef {import("../types/quests.d.js").Quest} Quest
 * @typedef {import("../types/quests.d.js").Chapter} Chapter
 * @typedef {import("../types/quests.d.js").ExitZone} ExitZone
 * @typedef {import("../types/quests.d.js").Npc} Npc
 * @typedef {import("../types/quests.d.js").ChapterProblem} ChapterProblem
 */

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

// --- Generic Helpers for Validation ---

/**
 * Validates if a value is a non-empty string.
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} [message]
 * @returns {ValidationResult}
 */
const isNonEmptyString = (value, fieldName, message) => {
	const errors = [];
	if (typeof value !== "string" || value.trim().length === 0) {
		errors.push({
			field: fieldName,
			message: message || `${fieldName} must be a non-empty string`,
			value: value,
		});
	}
	return createValidationResult(errors);
};

/**
 * Validates if a value is a finite number.
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} [message]
 * @returns {ValidationResult}
 */
const isFiniteNumber = (value, fieldName, message) => {
	const errors = [];
	if (typeof value !== "number" || !Number.isFinite(value)) {
		errors.push({
			field: fieldName,
			message: message || `${fieldName} must be a finite number`,
			value: value,
		});
	}
	return createValidationResult(errors);
};

/**
 * Validates if a value is an object (non-null, non-array).
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} [message]
 * @returns {ValidationResult}
 */
const isPlainObject = (value, fieldName, message) => {
	const errors = [];
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		errors.push({
			field: fieldName,
			message: message || `${fieldName} must be an object`,
			value: value,
		});
	}
	return createValidationResult(errors);
};

/**
 * Validates if a value is an array of non-empty strings.
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} [message]
 * @returns {ValidationResult}
 */
const isArrayOfNonEmptyStrings = (value, fieldName, message) => {
	const errors = [];
	if (!Array.isArray(value)) {
		errors.push({
			field: fieldName,
			message: message || `${fieldName} must be an array`,
			value: value,
		});
		return createValidationResult(errors);
	}
	if (
		value.some(
			(item) => typeof item !== "string" || item.trim().length === 0,
		)
	) {
		errors.push({
			field: fieldName,
			message:
				message || `${fieldName} must contain only non-empty strings`,
			value: value,
		});
	}
	return createValidationResult(errors);
};

// --- Specific Validators ---

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
	 * @param {string} [fieldName='questId'] - Optional field name for error reporting
	 * @returns {ValidationResult}
	 */
	validate(questId, fieldName = "questId") {
		const errors = [];

		if (typeof questId !== "string") {
			errors.push({
				field: fieldName,
				message: `${fieldName} must be a string`,
				value: questId,
			});
		} else if (questId.trim().length === 0) {
			errors.push({
				field: fieldName,
				message: `${fieldName} cannot be empty`,
				value: questId,
			});
		} else if (!/^[a-z0-9-]+$/.test(questId)) {
			errors.push({
				field: fieldName,
				message: `${fieldName} must contain only lowercase letters, numbers, and hyphens`,
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

// Define quest statuses here for validation
export const QuestStatuses = {
	AVAILABLE: "available",
	COMING_SOON: "coming_soon",
	COMPLETED: "completed",
};

/**
 * Quest Status Validator
 */
export const QuestStatusValidator = {
	VALID_STATUSES: Object.values(QuestStatuses),

	/**
	 * @param {unknown} status
	 * @returns {ValidationResult}
	 */
	validate(status) {
		const errors = [];
		const stringCheck = isNonEmptyString(
			status,
			"status",
			"Quest status must be a non-empty string",
		);
		if (!stringCheck.isValid) {
			errors.push(...stringCheck.errors);
		} else if (
			!this.VALID_STATUSES.includes(/** @type {string} */ (status))
		) {
			errors.push({
				field: "status",
				message: `Quest status must be one of: ${this.VALID_STATUSES.join(", ")}`,
				value: status,
			});
		}
		return createValidationResult(errors);
	},
};

/**
 * Exit Zone Validator
 */
export const ExitZoneValidator = {
	/**
	 * @param {unknown} exitZone
	 * @returns {ValidationResult}
	 */
	validate(exitZone) {
		const errors = [];

		const objectCheck = isPlainObject(
			exitZone,
			"exitZone",
			"Exit zone must be an object",
		);
		if (!objectCheck.isValid) {
			errors.push(...objectCheck.errors);
			return createValidationResult(errors); // Cannot validate properties if not an object
		}

		// Assume exitZone is an object for further checks
		const zone = /** @type {Record<string, unknown>} */ (exitZone);

		errors.push(
			...isFiniteNumber(
				zone.x,
				"exitZone.x",
				"Exit zone X must be a finite number",
			).errors,
			...isFiniteNumber(
				zone.y,
				"exitZone.y",
				"Exit zone Y must be a finite number",
			).errors,
			...isFiniteNumber(
				zone.width,
				"exitZone.width",
				"Exit zone width must be a finite number",
			).errors,
			...isFiniteNumber(
				zone.height,
				"exitZone.height",
				"Exit zone height must be a finite number",
			).errors,
			...isNonEmptyString(
				zone.label,
				"exitZone.label",
				"Exit zone label must be a non-empty string",
			).errors,
		);

		if (
			zone.width !== undefined &&
			typeof zone.width === "number" &&
			zone.width <= 0
		) {
			errors.push({
				field: "exitZone.width",
				message: "Exit zone width must be positive",
				value: zone.width,
			});
		}
		if (
			zone.height !== undefined &&
			typeof zone.height === "number" &&
			zone.height <= 0
		) {
			errors.push({
				field: "exitZone.height",
				message: "Exit zone height must be positive",
				value: zone.height,
			});
		}

		return createValidationResult(errors);
	},
};

/**
 * NPC Validator
 */
export const NpcValidator = {
	/**
	 * @param {unknown} npc
	 * @returns {ValidationResult}
	 */
	validate(npc) {
		const errors = [];

		const objectCheck = isPlainObject(npc, "npc", "NPC must be an object");
		if (!objectCheck.isValid) {
			errors.push(...objectCheck.errors);
			return createValidationResult(errors);
		}

		const npcObj = /** @type {Record<string, unknown>} */ (npc);

		errors.push(
			...isNonEmptyString(
				npcObj.name,
				"npc.name",
				"NPC name must be a non-empty string",
			).errors,
			...isFiniteNumber(
				npcObj.x,
				"npc.x",
				"NPC X must be a finite number",
			).errors,
			...isFiniteNumber(
				npcObj.y,
				"npc.y",
				"NPC Y must be a finite number",
			).errors,
			...isArrayOfNonEmptyStrings(
				npcObj.dialog,
				"npc.dialog",
				"NPC dialog must be an array of non-empty strings",
			).errors,
		);

		return createValidationResult(errors);
	},
};

/**
 * Chapter Problem Validator
 */
export const ChapterProblemValidator = {
	/**
	 * @param {unknown} problem
	 * @returns {ValidationResult}
	 */
	validate(problem) {
		const errors = [];

		const objectCheck = isPlainObject(
			problem,
			"problem",
			"Chapter problem must be an object",
		);
		if (!objectCheck.isValid) {
			errors.push(...objectCheck.errors);
			return createValidationResult(errors);
		}

		const problemObj = /** @type {Record<string, unknown>} */ (problem);

		errors.push(
			...isNonEmptyString(
				problemObj.description,
				"problem.description",
				"Chapter problem description must be a non-empty string",
			).errors,
			...isNonEmptyString(
				problemObj.code,
				"problem.code",
				"Chapter problem code must be a non-empty string",
			).errors,
		);

		return createValidationResult(errors);
	},
};

/**
 * Chapter Validator
 */
export const ChapterValidator = {
	/**
	 * @param {unknown} chapter
	 * @returns {ValidationResult}
	 */
	validate(chapter) {
		const errors = [];

		const objectCheck = isPlainObject(
			chapter,
			"chapter",
			"Chapter must be an object",
		);
		if (!objectCheck.isValid) {
			errors.push(...objectCheck.errors);
			return createValidationResult(errors);
		}

		const chapterObj = /** @type {Record<string, unknown>} */ (chapter);

		errors.push(
			...QuestIdValidator.validate(
				/** @type {string} */ (chapterObj.id),
				"chapter.id",
			).errors,
			...isNonEmptyString(
				chapterObj.title,
				"chapter.title",
				"Chapter title must be a non-empty string",
			).errors,
		);

		// Validate content: description OR problem, not both, not neither
		const isDescriptionPresent = chapterObj.description !== undefined;
		const isProblemPresent = chapterObj.problem !== undefined;

		if (!isDescriptionPresent && !isProblemPresent) {
			errors.push({
				field: "chapter.content",
				message:
					"Chapter must define either a 'description' or a 'problem' object.",
				value: chapterObj,
			});
		} else if (isDescriptionPresent && isProblemPresent) {
			errors.push({
				field: "chapter.content",
				message:
					"Chapter cannot define both 'description' and 'problem'; choose one.",
				value: chapterObj,
			});
		} else if (isDescriptionPresent) {
			// Validate description: must be string or a non-null object (for Lit TemplateResult)
			if (
				typeof chapterObj.description !== "string" &&
				(typeof chapterObj.description !== "object" ||
					chapterObj.description === null ||
					Array.isArray(chapterObj.description))
			) {
				errors.push({
					field: "chapter.description",
					message:
						"Chapter description must be a string or a Lit TemplateResult object.",
					value: chapterObj.description,
				});
			} else if (
				typeof chapterObj.description === "string" &&
				chapterObj.description.trim().length === 0
			) {
				errors.push({
					field: "chapter.description",
					message: "Chapter description (string) cannot be empty.",
					value: chapterObj.description,
				});
			}
		} else if (isProblemPresent) {
			errors.push(...ChapterProblemValidator.validate(chapterObj.problem).errors);
		}

		if (chapterObj.exitZone === undefined) {
			errors.push({
				field: "chapter.exitZone",
				message: "Chapter is missing exitZone",
				value: chapterObj.exitZone,
			});
		} else {
			errors.push(...ExitZoneValidator.validate(chapterObj.exitZone).errors);
		}

		if (chapterObj.npc !== undefined) {
			errors.push(...NpcValidator.validate(chapterObj.npc).errors);
		}

		return createValidationResult(errors);
	},
};

/**
 * Quest Validator
 */
export const QuestValidator = {
	/**
	 * @param {unknown} quest
	 * @returns {ValidationResult}
	 */
	validate(quest) {
		const errors = [];

		const objectCheck = isPlainObject(
			quest,
			"quest",
			"Quest must be an object",
		);
		if (!objectCheck.isValid) {
			errors.push(...objectCheck.errors);
			return createValidationResult(errors);
		}

		const questObj = /** @type {Record<string, unknown>} */ (quest);

		errors.push(
			...QuestIdValidator.validate(
				/** @type {string} */ (questObj.id),
			).errors,
			...isNonEmptyString(
				questObj.title,
				"quest.title",
				"Quest title must be a non-empty string",
			).errors,
			...isNonEmptyString(
				questObj.description,
				"quest.description",
				"Quest description must be a non-empty string",
			).errors,
			...QuestStatusValidator.validate(questObj.status).errors,
			...isNonEmptyString(
				questObj.image,
				"quest.image",
				"Quest image path must be a non-empty string",
			).errors,
		);

		if (!Array.isArray(questObj.chapters)) {
			errors.push({
				field: "quest.chapters",
				message: "Quest chapters must be an array",
				value: questObj.chapters,
			});
		} else if (questObj.chapters.length === 0) {
			errors.push({
				field: "quest.chapters",
				message: "Quest must have at least one chapter",
				value: questObj.chapters,
			});
		} else {
			questObj.chapters.forEach((chapter, index) => {
				const chapterValidation = ChapterValidator.validate(chapter);
				if (!chapterValidation.isValid) {
					chapterValidation.errors.forEach((err) => {
						errors.push({
							...err,
							field: `quest.chapters[${index}].${err.field}`,
							message: `Chapter ${index}: ${err.message}`,
						});
					});
				}
			});
		}

		if (questObj.prerequisites !== undefined) {
			errors.push(
				...isArrayOfNonEmptyStrings(
					questObj.prerequisites,
					"quest.prerequisites",
					"Quest prerequisites must be an array of non-empty strings",
				).errors,
			);
		}

		return createValidationResult(errors);
	},

	/**
	 * Validate quest and return Result
	 * @param {Quest} quest
	 * @returns {Result<Quest, ValidationError[]>}
	 */
	validateResult(quest) {
		return toResult(this.validate(quest), quest);
	},
};
