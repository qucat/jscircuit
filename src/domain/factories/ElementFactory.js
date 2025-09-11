/**
 * A factory class responsible for creating instances of elements.
 * It delegates element retrieval to `ElementRegistry`, ensuring
 * a single source of truth for registered elements.
 */

import { ElementRegistry } from './ElementRegistry.js';
import { generateId } from '../../utils/idGenerator.js'; // adjust path as needed

export class ElementFactory {
    /**
     * Creates a new instance of an element based on the specified type.
     * If no ID is provided, one is generated automatically using the type prefix.
     *
     * @param {string} type - The type of the element to create.
     * @param {string|null|undefined} id - Optional unique identifier.
     * @param {Position[]} nodes - The array of terminal positions.
     * @param {Properties} properties - A Properties instance.
     * @param {Label|null} label - Optional label (default: null).
     * @returns {Element} An instance of the requested element type.
     * @throws {Error} If the type is not registered in the registry.
     */
    static create(type, id, nodes, properties, label = null) {
        const factoryFunction = ElementRegistry.get(type);
        if (!factoryFunction) {
            throw new Error(`Element type "${type}" is not registered.`);
        }

        // Generate ID if not provided
        const safeId = id ?? generateId(type[0].toUpperCase());

        return factoryFunction(safeId, nodes, label, properties);
    }
}
