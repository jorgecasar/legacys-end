/**
 * CommandFactory
 *
 * Responsible for creating command instances from serialized names and metadata.
 * Centralizes command registration and dependency injection for commands.
 */
export class CommandFactory {
	/**
	 * @param {Object} dependencies - Global dependencies to be injected into commands
	 */
	constructor(dependencies = {}) {
		this.dependencies = dependencies;
		/** @type {Map<string, any>} */
		this.registry = new Map();
	}

	/**
	 * Register a command class
	 * @param {string} name - Command name
	 * @param {any} CommandClass - Command class constructor
	 */
	register(name, CommandClass) {
		this.registry.set(name, CommandClass);
	}

	/**
	 * Create a command instance
	 * @param {string} name - Command name
	 * @param {Object} [metadata] - Command metadata/parameters
	 * @returns {import('./i-command.js').ICommand}
	 * @throws {Error} If command is not registered
	 */
	create(name, metadata = {}) {
		const CommandClass = this.registry.get(name);
		if (!CommandClass) {
			throw new Error(`Command "${name}" not registered in factory`);
		}

		return new CommandClass({
			...this.dependencies,
			...metadata,
		});
	}

	/**
	 * Create multiple commands (e.g. for a macro)
	 * @param {Array<{name: string, metadata?: Object}>} commandSpecs
	 * @returns {Array<import('./i-command.js').ICommand>}
	 */
	createSequence(commandSpecs) {
		return commandSpecs.map((spec) => this.create(spec.name, spec.metadata));
	}
}
