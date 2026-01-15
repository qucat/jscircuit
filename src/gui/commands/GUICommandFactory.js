/**
 * GUICommandFactory: Manages GUI command creation and execution.
 */
export class GUICommandFactory {
    constructor(circuitService, circuitRenderer, elementRegistry) {
        this.circuitService = circuitService;
        this.circuitRenderer = circuitRenderer;
        this.elementRegistry = elementRegistry;
        this.commands = new Map();
    }

    /**
     * Registers a new command.
     * @param {string} name - Command name.
     * @param {Class} CommandClass - Command class reference.
     * @param {...any} args - Arguments to pass to the command.
     */
    register(name, CommandClass, ...args) {
        if (this.commands.has(name)) {
            throw new Error(`Command "${name}" is already registered.`);
        }
        this.commands.set(
            name,
            new CommandClass(this.circuitService, this.circuitRenderer, this.elementRegistry, ...args)
        );
    }

    /**
     * Retrieves a command.
     * @param {string} name - Command name.
     * @returns {GUICommand} - Command instance.
     */
    get(name) {
        return this.commands.get(name);
    }
}