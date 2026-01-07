/**
 * Command Interface
 *
 * Defines the contract for all commands in the system.
 * Commands encapsulate actions that can be executed, undone, and validated.
 */

/**
 * @typedef {Object} ICommand
 * @property {() => any} execute - Execute the command
 * @property {() => void | Promise<void>} [undo] - Undo the command (optional)
 * @property {() => boolean} [canExecute] - Check if command can execute (optional)
 * @property {string} name - Command name for debugging and logging
 * @property {Object} [metadata] - Additional metadata about the command
 */

export {};
