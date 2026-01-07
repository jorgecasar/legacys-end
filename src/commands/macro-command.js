/**
 * MacroCommand
 *
 * A command that encapsulates a sequence of other commands.
 * Supports atomic execution and undo.
 */
export class MacroCommand {
	/**
	 * @param {Object} params
	 * @param {Array<import('./i-command.js').ICommand>} params.commands - Sequence of commands to execute
	 * @param {string} [params.name] - Macro name
	 * @param {Object} [params.metadata] - Optional metadata
	 */
	constructor({ commands, name = "Macro", metadata = {} }) {
		this.commands = commands;
		this.name = name;
		this.metadata = metadata;
		/** @type {Array<import('./i-command.js').ICommand>} */
		this.executedCommands = [];
	}

	/**
	 * Check if macro can execute
	 * All commands in macro must be able to execute
	 * @returns {boolean}
	 */
	canExecute() {
		return this.commands.every((cmd) => !cmd.canExecute || cmd.canExecute());
	}

	/**
	 * Execute all commands in sequence.
	 * If any command fails, previous commands are undone to maintain atomicity.
	 */
	async execute() {
		this.executedCommands = [];
		for (const command of this.commands) {
			try {
				const result = await command.execute();
				// Check for failure result (some commands return result instead of throwing)
				if (result && result.success === false) {
					throw result.error || new Error(`Command ${command.name} failed`);
				}
				this.executedCommands.push(command);
			} catch (error) {
				// Rollback already executed commands
				for (let i = this.executedCommands.length - 1; i >= 0; i--) {
					await this.executedCommands[i].undo?.();
				}
				throw error;
			}
		}
	}

	/**
	 * Undo the entire macro
	 */
	async undo() {
		// Undo in reverse order
		for (let i = this.executedCommands.length - 1; i >= 0; i--) {
			await this.executedCommands[i].undo?.();
		}
	}
}
