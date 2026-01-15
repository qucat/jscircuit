/**
 * @module GUI/Commands
 * @description
 * **GUI Layer - Command Registry**
 *
 * Registry for all available GUI commands. This is a key extension point
 * where new user actions are registered and mapped to their implementations.
 */

class GUICommandRegistryClass {
    constructor() {
        if (!GUICommandRegistryClass.instance) {
            this._registry = new Map();
            GUICommandRegistryClass.instance = this;
        }
        else {
            this._registry = GUICommandRegistryClass.instance._registry;  // Ensure continuity
        }
        return GUICommandRegistryClass.instance;
    }

    /**
     * Registers a command by name.
     * @param {string} name - The command name.
     * @param {Function} commandFactory - A factory function returning a command instance.
     */
    register(name, commandFactory) {
        if (this._registry.has(name)) {
            throw new Error(`Command "${name}" is already registered.`);
        }
        this._registry.set(name, commandFactory);
    }

    /**
     * Retrieves a command by name.
     * @param {string} name - The command name.
     * @returns {Command} - The command instance.
     */
    get(name, ...args) {
        if (!this._registry.has(name)) {
            console.warn(`Command "${name}" not found.`);
            return null;
        }
        return this._registry.get(name)(...args);
    }

    /**
     * Returns all registered command names.
     * @returns {string[]} - List of registered command names.
     */
    getTypes() {
        return [...this._registry.keys()];
    }
}

// Create a Singleton Instance
const GUICommandRegistry = new GUICommandRegistryClass();
Object.freeze( GUICommandRegistry );
export { GUICommandRegistry };
