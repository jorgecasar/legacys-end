import { logger } from "../services/logger-service.js";

/**
 * CommandBus
 *
 * Central dispatcher for all commands in the system.
 * Provides:
 * - Command execution with middleware
 * - Command history tracking
 * - Undo/Redo functionality
 * - Middleware pipeline
 */
export class CommandBus {
	/**
	 * @param {Object} options
	 * @param {number} [options.maxHistorySize=100] - Maximum number of commands to keep in history
	 */
	constructor(options = {}) {
		/** @type {Array<import('./i-command.js').ICommand>} */
		this.history = [];

		/** @type {Array<import('./i-command.js').ICommand>} */
		this.undoStack = [];

		/** @type {Array<(command: import('./i-command.js').ICommand) => boolean>} */
		this.middleware = [];

		this.maxHistorySize = options.maxHistorySize || 100;
		this._isRecording = false;
		/** @type {Array<import('./i-command.js').ICommand>} */
		this._recordedCommands = [];
	}

	/**
	 * Register middleware
	 * Middleware can inspect, modify, or cancel command execution
	 *
	 * @param {(command: import('./i-command.js').ICommand) => boolean} middleware
	 * @returns {() => void} Unregister function
	 */
	use(middleware) {
		this.middleware.push(middleware);

		// Return unregister function
		return () => {
			const index = this.middleware.indexOf(middleware);
			if (index > -1) {
				this.middleware.splice(index, 1);
			}
		};
	}

	/**
	 * Execute a command
	 *
	 * @param {import('./i-command.js').ICommand} command
	 * @returns {Promise<{success: boolean, reason?: string, error?: Error}>}
	 */
	async execute(command) {
		try {
			// Run middleware (can cancel execution)
			for (const mw of this.middleware) {
				if (!mw(command)) {
					logger.debug(
						`[CommandBus] Command ${command.name} cancelled by middleware`,
					);
					return { success: false, reason: "cancelled by middleware" };
				}
			}

			// Check if can execute
			if (command.canExecute && !command.canExecute()) {
				logger.debug(
					`[CommandBus] Command ${command.name} cannot execute (canExecute returned false)`,
				);
				return { success: false, reason: "canExecute returned false" };
			}

			// Execute command
			await command.execute();

			// Add to history (only if command supports undo)
			if (command.undo) {
				this.history.push(command);

				// Limit history size
				if (this.history.length > this.maxHistorySize) {
					this.history.shift();
				}

				// Clear undo stack (new action invalidates redo)
				this.undoStack = [];
			}

			// Add to recording if active
			if (this._isRecording) {
				this._recordedCommands.push(command);
			}

			logger.debug(
				`[CommandBus] Command ${command.name} executed successfully`,
			);
			return { success: true };
		} catch (error) {
			logger.error(
				`[CommandBus] Command ${command.name} failed:`,
				/** @type {Error} */ (error),
			);
			return { success: false, error: /** @type {Error} */ (error) };
		}
	}

	/**
	 * Undo last command
	 *
	 * @returns {Promise<boolean>} True if undo was successful
	 */
	async undo() {
		if (this.history.length === 0) {
			logger.debug("[CommandBus] No commands to undo");
			return false;
		}

		const command = this.history.pop();
		if (!command) return false;

		if (command.undo) {
			try {
				await command.undo();
				this.undoStack.push(command);
				logger.debug(`[CommandBus] Command ${command.name} undone`);
				return true;
			} catch (error) {
				logger.error(
					`[CommandBus] Failed to undo ${command.name}:`,
					/** @type {Error} */ (error),
				);
				// Re-add to history if undo failed
				this.history.push(command);
				return false;
			}
		}

		return false;
	}

	/**
	 * Redo last undone command
	 *
	 * @returns {Promise<boolean>} True if redo was successful
	 */
	async redo() {
		if (this.undoStack.length === 0) {
			logger.debug("[CommandBus] No commands to redo");
			return false;
		}

		const command = this.undoStack.pop();
		if (!command) return false;

		try {
			await command.execute();
			this.history.push(command);
			logger.debug(`[CommandBus] Command ${command.name} redone`);
			return true;
		} catch (error) {
			logger.error(
				`[CommandBus] Failed to redo ${command.name}:`,
				/** @type {Error} */ (error),
			);
			// Re-add to undo stack if redo failed
			this.undoStack.push(command);
			return false;
		}
	}

	/**
	 * Clear command history and undo stack
	 */
	clear() {
		this.history = [];
		this.undoStack = [];
		logger.debug("[CommandBus] History cleared");
	}

	/**
	 * Get command history (read-only copy)
	 *
	 * @returns {Array<import('./i-command.js').ICommand>}
	 */
	getHistory() {
		return [...this.history];
	}

	/**
	 * Get undo stack (read-only copy)
	 *
	 * @returns {Array<import('./i-command.js').ICommand>}
	 */
	getUndoStack() {
		return [...this.undoStack];
	}

	/**
	 * Check if undo is available
	 *
	 * @returns {boolean}
	 */
	canUndo() {
		return this.history.length > 0;
	}

	/**
	 * Check if redo is available
	 *
	 * @returns {boolean}
	 */
	canRedo() {
		return this.undoStack.length > 0;
	}

	/**
	 * Start recording commands
	 */
	startRecording() {
		this._isRecording = true;
		this._recordedCommands = [];
		logger.debug("[CommandBus] recording started");
	}

	/**
	 * Stop recording and return recorded commands
	 * @returns {Array<import('./i-command.js').ICommand>}
	 */
	stopRecording() {
		this._isRecording = false;
		const commands = [...this._recordedCommands];
		this._recordedCommands = [];
		logger.debug(
			`[CommandBus] recording stopped (${commands.length} commands)`,
		);
		return commands;
	}

	/**
	 * Check if currently recording
	 * @returns {boolean}
	 */
	isRecording() {
		return this._isRecording;
	}
}
