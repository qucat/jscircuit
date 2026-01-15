// Import the factory responsible for creating elements
import { ElementFactory } from '../domain/factories/ElementFactory.js';

// Import the Position class for terminal position manipulation
import { Position } from '../domain/valueObjects/Position.js';

// Import the Element base class (used for type annotations and operations)
import { Element } from '../domain/entities/Element.js';

/**
 * ElementService class responsible for managing element creation, deletion, movement, rotation, 
 * and property updates using the provided factory and domain logic.
 */
export class ElementService {
    /**
     * Constructs the ElementService.
     * 
     * @param {ElementFactory} elementFactory - The factory responsible for creating elements.
     */
    constructor(elementFactory) {
        this.elementFactory = elementFactory;
    }

    /**
     * Creates a new element using the factory.
     * 
     * @param {string} type - The type of the element to create (e.g., "Resistor", "Junction").
     * @param {string} id - The unique identifier for the element.
     * @param {Position[]} nodes - The terminal positions.
     * @param {Object} propertiesArgs - The arguments for the specific properties container.
     * @returns {Element} The newly created element.
     */
    static create(type, id, nodes, propertiesArgs) {
        if (!this.elementFactory) {
            throw new Error("ElementFactory is not set.");
        }
        return this.elementFactory.create(type, id, nodes, propertiesArgs);
    }

    /**
     * Deletes an element.
     * 
     * @param {Element[]} elements - The array of elements.
     * @param {string} id - The unique identifier of the element to delete.
     * @returns {Element[]} The updated list of elements.
     */
    static delete(elements, id) {
        return elements.filter(element => element.id !== id);
    }

    /**
     * Moves an element to a new position, updating all terminal positions.
     * 
     * @param {Element} element - The element to move.
     * @param {Position} newReferencePosition - The new position for the reference terminal.
     */
    static move(element, newReferencePosition) {
        const refTerminal = element.nodes[0];
        const deltaX = newReferencePosition.x - refTerminal.x;
        const deltaY = newReferencePosition.y - refTerminal.y;

        element.nodes = element.nodes.map(terminal => 
            new Position(terminal.x + deltaX, terminal.y + deltaY)
        );
    }

    /**
     * Rotates an element to a new orientation.
     * 
     * @param {Element} element - The element to rotate.
     * @param {number} newOrientation - The new orientation (0, 90, 180, or 270 degrees).
     */
    static rotate(element, newOrientation) {
        if (![0, 90, 180, 270].includes(newOrientation)) {
            throw new Error("Orientation must be one of 0, 90, 180, or 270 degrees.");
        }

        const refTerminal = element.nodes[0];
        const refX = refTerminal.x;
        const refY = refTerminal.y;

        element.nodes = element.nodes.map((terminal, index) => {
            if (index === 0) return terminal;

            const relX = terminal.x - refX;
            const relY = terminal.y - refY;

            const [newRelX, newRelY] = ElementService._rotatePosition(relX, relY, newOrientation);

            return new Position(refX + newRelX, refY + newRelY);
        });
    }

    /**
     * Rotates a position around the origin.
     * 
     * @param {number} x - The x-coordinate of the position.
     * @param {number} y - The y-coordinate of the position.
     * @param {number} angle - The angle to rotate by (in degrees).
     * @returns {number[]} The rotated [x, y] position.
     */
    static _rotatePosition(x, y, angle) {
        const radians = (Math.PI / 180) * angle;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const newX = Math.round(x * cos - y * sin);
        const newY = Math.round(x * sin + y * cos);
        return [newX, newY];
    }

    /**
     * Updates properties of an element.
     * 
     * @param {Element} element - The element whose properties are being updated.
     * @param {Object} updates - An object containing property updates.
     * @throws {Error} If any property value is invalid.
     */
    static updateProperties(element, updates) {
        Object.entries(updates).forEach(([key, value]) => {
            if (!element.properties.isValidValue(value)) {
                throw new Error(`Invalid value for property "${key}". Must be a float, "variable", or "undefined".`);
            }
            element.properties.values[key] = value;
        });
    }
}
