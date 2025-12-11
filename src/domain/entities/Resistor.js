import { Element } from './Element.js';
import { Properties } from '../valueObjects/Properties.js';
import { Resistance } from '../valueObjects/Resistance.js';

/**
 * @class Resistor
 * @extends Element
 * @description
 * Represents a resistor component in the circuit, providing electrical resistance
 * between two connection points.
 *
 * A resistor is a passive two-terminal electrical component that implements electrical
 * resistance as a circuit element. In the QuCat circuit generator, resistors are
 * fundamental components used for impedance control and signal conditioning.
 *
 * **Physical Properties:**
 * - Resistance value in ohms (Ω)
 * - Orientation for visual representation
 * - Two connection nodes (start and end points)
 *
 * **Usage in QuCat:**
 * Resistors are commonly used in quantum circuit analysis for modeling
 * dissipative elements and coupling mechanisms.
 *
 * @example
 * const resistor = new Resistor(
 *   'R1',
 *   [new Position(0, 0), new Position(50, 0)],
 *   new Label('R1'),
 *   new Properties({ resistance: 1000 })  // 1kΩ
 * );
 */
export class Resistor extends Element {
    /**
     * Creates an instance of Resistor.
     * 
     * @param {string} id - The unique identifier for the resistor.
     * @param {Position[]} nodes - The two node positions for the resistor.
     * @param {Label|null} label - The label of the resistor (optional).
     * @param {Properties} properties - A container for the resistor's properties, including resistance.
     */
    constructor(id, nodes, label = null, properties = new Properties({ resistance: undefined })) {
        if (nodes.length !== 2) {
            throw new Error("A Resistor must have exactly two nodes.");
        }

        if (!(properties instanceof Properties)) {
            throw new Error("Properties must be an instance of Properties.");
        }

        const resistance = properties.values.resistance;

        if (resistance !== undefined) {
            if (typeof resistance !== 'number') {
                throw new Error("Resistance must be a number or undefined.");
            }
            new Resistance(resistance); // validates
        }

        super(id, nodes, label, properties);
        this.type = 'resistor';
    }
}
