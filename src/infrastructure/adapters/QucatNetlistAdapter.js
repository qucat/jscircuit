import fs from 'fs';
import { Position } from '../../domain/valueObjects/Position.js';
import { Properties } from '../../domain/valueObjects/Properties.js';
import { ElementFactory } from '../../domain/factories/ElementFactory.js';

/**
 * Type mapping between short code (used in .qucat format)
 * and full element type with expected property name.
 */
const typeMap = {
    R: { fullType: 'resistor', propertyKey: 'resistance' },
    C: { fullType: 'capacitor', propertyKey: 'capacitance' },
    L: { fullType: 'inductor', propertyKey: 'inductance' },
    J: { fullType: 'junction', propertyKey: 'value' },
    G: { fullType: 'ground', propertyKey: 'value' },
    W: { fullType: 'wire', propertyKey: 'value' }
};

/**
 * QucatNetlistAdapter
 * 
 * Handles reading and writing circuits in a QuCAT-style netlist format:
 *   <Type>;<x1,y1>;<x2,y2>;<value>;<label>
 */
export class QucatNetlistAdapter {
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

            // Identify which shorttype matches to type
            const mapEntry = Object.entries(typeMap).find(([shortType, { fullType }]) => fullType === type);
            if (!mapEntry) throw new Error(`Unknown element type: ${type}`); // throw an error if type is not found
            const [shortType] = mapEntry; // destructure to get the short type

            const node1 = `${nodes[0].x},${nodes[0].y}`;
            const node2 = `${nodes[1].x},${nodes[1].y}`;

            const value = Object.values(properties).find(v => typeof v === 'number') ?? '';
            const labelStr = label ?? '';

            let vFormatted = value;

            // Format the value to a string
            if (typeof value === 'number') {
                let decimals = 1, vString = '0';
                while (parseFloat(vString) !== value && decimals < 15) {
                    vString = value.toExponential(decimals);
                    decimals += 1;
                }
                vFormatted = vString;
            }
            return `${shortType};${node1};${node2};${vFormatted};${labelStr}`;
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
            const [shortType, pos1, pos2, valueStr, labelStr] = line.trim().split(';');
    
            const mapEntry = typeMap[shortType];
            if (!mapEntry) throw new Error(`Unknown element type: ${shortType}`);
    
            const { fullType, propertyKey } = mapEntry;
    
            const [x1, y1] = pos1.split(',').map(Number);
            const [x2, y2] = pos2.split(',').map(Number);
            const nodes = [new Position(x1, y1), new Position(x2, y2)];
    
            // Preserve property key even if value is missing
            const raw = valueStr?.trim();
            const value = raw === '' || raw === undefined ? undefined : parseFloat(raw);

            const label = labelStr && labelStr.trim() !== '' ? labelStr : null;
            const id = `${shortType}_${x1}_${y1}_${x2}_${y2}`;

            const propObj = { [propertyKey]: value };

            let properties;
            if (value !== undefined) {
                properties = new Properties(propObj); // Must accept undefined
            }

            if (propObj === undefined) {
                // If properties is undefined, create an empty Properties instance
                properties = new Properties();
            }

            const element = ElementFactory.create(fullType, id, nodes, properties, label);
            elements.push(element);
        }
    
        return elements;
    }
}
