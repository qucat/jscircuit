import fs from 'fs';
import { Position } from '../../domain/valueObjects/Position.js';
import { Properties } from '../../domain/valueObjects/Properties.js';
import { ElementFactory } from '../../domain/factories/ElementFactory.js';

/**
 * NetlistAdapter
 * 
 * Handles reading and writing circuits in a QuCAT-style netlist format:
 *   <Type>;<x1,y1>;<x2,y2>;<value>;<label>
 */
export class NetlistAdapter {
    /**
     * Export the current circuit to a .qucat-style netlist file.
     * 
     * @param {Circuit} circuit - The domain aggregate.
     * @param {string} path - Destination file path.
     */
    static exportToFile(circuit, path) {
        const serialized = circuit.getSerializedElements();
        const netlist = this._serializeElements(serialized);
        fs.writeFileSync(path, netlist, 'utf-8');
    }

    /**
     * Import elements from a .qucat-style netlist file.
     * 
     * @param {string} path - Path to the file to load.
     * @returns {Element[]} An array of Element instances.
     */
    static importFromFile(path) {
        const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
        return this._deserializeElements(lines);
    }

    /**
     * Internal: Serialize elements into .qucat netlist lines.
     * 
     * @param {Array<Object>} elements - Serialized element objects.
     * @returns {string} Netlist string content.
     */
    static _serializeElements(elements) {
        return elements.map(el => {
            const { type, nodes, properties, label, id } = el;

            const node1 = `${nodes[0].x},${nodes[0].y}`;
            const node2 = `${nodes[1].x},${nodes[1].y}`;

            const value = Object.values(properties).find(v => typeof v === 'number') ?? '';
            const labelStr = label ?? '';

            let vFormatted = value;
            if (typeof value === 'number') {
                let decimals = 1, vString = '0';
                while (parseFloat(vString) !== value && decimals < 15) {
                    vString = value.toExponential(decimals);
                    decimals += 1;
                }
                vFormatted = vString;
            }

            return `${type};${node1};${node2};${vFormatted};${labelStr}`;
        }).join('\n');
    }

    /**
     * Internal: Deserialize netlist lines into Element instances.
     * 
     * @param {string[]} lines - Each line follows the .qucat format.
     * @returns {Element[]} Instantiated domain elements.
     */
    static _deserializeElements(lines) {
        const elements = [];

        for (const line of lines) {
            const [type, pos1, pos2, valueStr, labelStr] = line.trim().split(';');

            const [x1, y1] = pos1.split(',').map(Number);
            const [x2, y2] = pos2.split(',').map(Number);

            const nodes = [new Position(x1, y1), new Position(x2, y2)];

            const propertyKey = {
                R: 'resistance',
                C: 'capacitance',
                L: 'inductance',
                J: 'value', // Adjust based on your domain
                G: 'value',
                W: 'value'
            }[type] ?? 'value';

            const value = valueStr ? parseFloat(valueStr) : 'undefined';
            const properties = new Properties({ [propertyKey]: value });

            const label = labelStr ? labelStr : null;
            const id = `${type}_${x1}_${y1}_${x2}_${y2}`;

            const element = ElementFactory.create(type, id, nodes, { ...properties.values, label });
            elements.push(element);
        }

        return elements;
    }
}
