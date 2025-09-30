import { Label } from '../valueObjects/Label.js';
import { Position } from '../valueObjects/Position.js';
import { Properties } from '../valueObjects/Properties.js';

/**
 * Represents an abstract element in a circuit.
 * 
 * @abstract
 */
export class Element {
    /**
     * Creates an instance of an Element.
     * 
     * @param {string} id - The unique identifier for the element.
     * @param {Position[]} nodes - The list of node positions.
     * @param {Label|null} label - The label of the element (optional).
     * @param {Properties} properties - A container for the element's specific properties.
     * @throws {Error} If attempting to instantiate the abstract class directly.
     */
    constructor(id, nodes, label = null, properties) 
        {
        if (new.target === Element) {
            throw new Error("Cannot instantiate abstract class Element directly.");
        }
        if (!Array.isArray(nodes) || !nodes.every(t => t instanceof Position)) {
            throw new Error("Nodes must be an array of Position instances.");
        }
        if (label !== null && !(label instanceof Label)) {
            throw new Error("Label must be an instance of Label or null.");
        }
        if (!(properties instanceof Properties)) {
            throw new Error("Properties must be an instance of Properties.");
        }

        this.id = id;
        this.nodes = nodes;
        this.label = label;
        this.type = null; // Each subclass must define its type
        this.properties = properties; // Properties container
    }

    /**
     * Describes the element with its type, id, nodes, label, and properties.
     * 
     * @returns {string} A string description of the element.
     */
    describe() {
        const labelText = this.label ? `, label: "${this.label}"` : '';
        const nodesText = this.nodes.map(t => `(${t.x}, ${t.y})`).join(', ');
        return `${this.type} (${this.id}): nodes: [${nodesText}]${labelText}, properties: ${this.properties.describe()}`;
    }

    /**
     * Gets the properties container for this element.
     *
     * @returns {Properties} The properties container.
     */
    getProperties() {
        return this.properties;
    }
}
