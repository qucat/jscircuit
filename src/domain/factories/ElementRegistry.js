/**
 * @module Domain/Factories
 * @description
 * **Domain Layer - Element Registry**
 *
 * Central registry for creating circuit elements. This is a key extension point
 * where new element types are registered so the system knows how to instantiate them.
 */

/**
 * 	A simple map storing factory functions for elements. Used for lookup
 * 	when creating new elements based on their type.
 */
class ElementRegistryClass  {
    constructor() {
        if (!ElementRegistryClass.instance) {
            this._registry = {};
            ElementRegistryClass.instance = this;
        }
        return ElementRegistryClass.instance;
    }

    /**
     * Registers a new element type.
     * @param {string} type - The name of the element type.
     * @param {Function} factoryFunction - The factory function for creating the element.
     */
    register(type, factoryFunction) {
        if (this._registry[type]) {
            throw new Error(`Element type "${type}" is already registered.`);
        }
        this._registry[type] = factoryFunction;
    }

    /**
     * Retrieves the factory function for a given element type.
     * @param {string} type - The element type.
     * @returns {Function} The factory function.
     */
    get(type) {
        return this._registry[type];
    }

    /**
     * Retrieves all registered element types.
     * @returns {string[]} The list of element types.
     */
    getTypes() {
        return Object.keys(this._registry);
    }
};

const ElementRegistry = new ElementRegistryClass();
Object.freeze(ElementRegistry);

export { ElementRegistry, ElementRegistryClass };
export default ElementRegistry;


