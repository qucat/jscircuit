// Remove fs import since we're running in browser
import { Position } from '../../domain/valueObjects/Position.js';
import { Properties } from '../../domain/valueObjects/Properties.js';
import { Label } from '../../domain/valueObjects/Label.js';
import { ElementFactory } from '../../domain/factories/ElementFactory.js';
import { CoordinateAdapter } from './CoordinateAdapter.js';
import { GridCoordinate } from '../../domain/valueObjects/GridCoordinate.js';

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
 * Reverse mapping from lowercase element types (as used in instances) to short codes
 */
const elementTypeToShortCode = {
    'resistor': 'R',
    'capacitor': 'C',
    'inductor': 'L',
    'junction': 'J',
    'ground': 'G',
    'wire': 'W'
};

/**
 * QucatNetlistAdapter
 * 
 * Handles reading and writing circuits in a QuCAT-style netlist format:
 *   <Type>;<x1,y1>;<x2,y2>;<value>;<label>
 */
export class QucatNetlistAdapter {
    /**
     * Export the current circuit to a .qucat-style netlist string.
     * 
     * @param {Circuit} circuit - The domain aggregate.
     * @returns {string} The netlist content as a string.
     */
    static exportToString(circuit) {
        const serialized = circuit.getSerializedElements();
        return this._serializeElements(serialized);
    }

    /**
     * Import elements from a .qucat-style netlist string.
     * 
     * @param {string} content - The netlist content as a string.
     * @returns {Element[]} An array of Element instances.
     */
    static importFromString(content) {
        const lines = content.trim().split('\n').filter(line => line.trim());
        return this._deserializeElements(lines);
    }

    /**
     * Internal: Serialize elements into .qucat netlist lines.
     * Converts pixel coordinates to logical coordinates for compact file format.
     * 
     * @param {Array<Object>} elements - Serialized element objects.
     * @returns {string} Netlist string content.
     */
    static _serializeElements(elements) {
        return elements.map(el => {
            const { type, nodes, properties, label, id } = el;

            // Use reverse mapping to get short code from element type
            const shortType = elementTypeToShortCode[type];
            if (!shortType) throw new Error(`Unknown element type: ${type}`);

            // Convert pixel coordinates to logical coordinates
            const pixelPos1 = new Position(nodes[0].x, nodes[0].y);
            const pixelPos2 = new Position(nodes[1].x, nodes[1].y);
            
            const logical1 = CoordinateAdapter.pixelToGrid(pixelPos1);
            const logical2 = CoordinateAdapter.pixelToGrid(pixelPos2);

            const node1 = `${logical1.x},${logical1.y}`;
            const node2 = `${logical2.x},${logical2.y}`;

            // Get the main property for this element type
            const mapEntry = typeMap[shortType];
            const { propertyKey } = mapEntry;
            
            // Extract the main value (resistance, capacitance, etc.)
            const value = propertyKey && properties[propertyKey] !== undefined ? properties[propertyKey] : '';
            const labelStr = label ?? '';

            let vFormatted = value;

            // Format number as scientific notation if needed
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
     * Converts logical coordinates from file back to pixel coordinates for internal use.
     * 
     * @param {string[]} lines - Each line follows the .qucat format.
     * @returns {Element[]} Instantiated domain elements.
     */
    static _deserializeElements(lines) {
        // First, detect format by analyzing component spans
        const detectedFormat = this._detectFormatByComponentSpans(lines);
        console.log(`� QuCat Format Detection: ${detectedFormat.version} with ${detectedFormat.confidence}% confidence - ${detectedFormat.reasoning}`);
        
        const elements = [];
    
        for (const line of lines) {
            const [shortType, pos1, pos2, valueStr, labelStr] = line.trim().split(';');
    
            const mapEntry = typeMap[shortType];
            if (!mapEntry) throw new Error(`Unknown element type: ${shortType}`);
    
            const { fullType, propertyKey } = mapEntry;
    
            // Parse logical coordinates from file
            const [logicalX1, logicalY1] = pos1.split(',').map(Number);
            const [logicalX2, logicalY2] = pos2.split(',').map(Number);
            
            let pixelPos1, pixelPos2;
            
            if (detectedFormat.version === 'v1.0') {
                // v1.0 coordinates need to be scaled to v2.0 then converted to pixels
                const v1Pos1 = new GridCoordinate(logicalX1, logicalY1);
                const v1Pos2 = new GridCoordinate(logicalX2, logicalY2);

                const v2Pos1 = CoordinateAdapter.v1ToV2Grid(v1Pos1);
                const v2Pos2 = CoordinateAdapter.v1ToV2Grid(v1Pos2);

                pixelPos1 = CoordinateAdapter.gridToPixel(v2Pos1);
                pixelPos2 = CoordinateAdapter.gridToPixel(v2Pos2);

            } else {
                // v2.0 coordinates can be directly converted to pixels
                const logicalPos1 = new GridCoordinate(logicalX1, logicalY1);
                const logicalPos2 = new GridCoordinate(logicalX2, logicalY2);

                pixelPos1 = CoordinateAdapter.gridToPixel(logicalPos1);
                pixelPos2 = CoordinateAdapter.gridToPixel(logicalPos2);
            }
            
            const nodes = [pixelPos1, pixelPos2];
    
            // Parse the main property value
            const raw = valueStr?.trim();
            const parsedValue = raw === '' || raw === undefined ? undefined : parseFloat(raw);

            const label = labelStr && labelStr.trim() !== '' ? new Label(labelStr.trim()) : null;

            // Create minimal property object with the main property key always present
            const propObj = {};
            if (propertyKey) {
                propObj[propertyKey] = parsedValue; // undefined if no value was serialized
            }

            // Create Properties instance (ElementRegistry will add defaults)
            const properties = new Properties(propObj);

            const element = ElementFactory.create(fullType, null, nodes, properties, label);
            elements.push(element);
        }
    
        return elements;
    }

    /**
     * Analyzes component spans in netlist to detect QuCat format version.
     * v1.0: Components span 1 interval (R;0,0;1,0 = 1 unit span)
     * v2.0: Components span 5 intervals (R;0,0;5,0 = 5 unit span)
     *
     * @param {string[]} lines - Netlist lines
     * @returns {Object} Detection result with version, confidence, and reasoning
     */
    static _detectFormatByComponentSpans(lines) {
        const componentTypes = ['R', 'C', 'L']; // Resistor, Capacitor, Inductor have defined spans
        const spans = [];
        let componentCount = 0;

        for (const line of lines) {
            const [shortType, pos1, pos2] = line.trim().split(';');

            if (!componentTypes.includes(shortType)) continue; // Skip wires, junctions, grounds

            const [x1, y1] = pos1.split(',').map(Number);
            const [x2, y2] = pos2.split(',').map(Number);

            // Calculate span (Manhattan distance)
            const span = Math.abs(x2 - x1) + Math.abs(y2 - y1);
            spans.push(span);
            componentCount++;
        }

        if (componentCount === 0) {
            console.warn('No primitive components found in QuCat file. Falling back to v2.0 (latest)');
            return {
                version: 'v2.0',
                confidence: 50,
                componentCount: 0,
                reasoning: 'No components found - fallback to latest version'
            };
        }

        // Analyze spans to determine format
        const uniqueSpans = [...new Set(spans)];
        const spanCounts = {};
        spans.forEach(span => spanCounts[span] = (spanCounts[span] || 0) + 1);

        const dominantSpan = Object.keys(spanCounts).reduce((a, b) =>
            spanCounts[a] > spanCounts[b] ? a : b
        );
        const dominantCount = spanCounts[dominantSpan];
        const confidence = Math.round((dominantCount / spans.length) * 100);

        let version, reasoning;

        // Check for mixed spans first
        const hasUnitSpans = spans.includes(1);
        const hasFiveSpans = spans.includes(5);
        const hasOnlyStandardSpans = uniqueSpans.every(span => span === 1 || span === 5);
        const hasBothStandardSpans = hasUnitSpans && hasFiveSpans;

        if (hasBothStandardSpans) {
            // Has both v1.0 and v2.0 components - prefer v2.0
            version = 'v2.0';
            reasoning = `Mixed spans but contains v2.0-style 5-interval components`;
        } else if (dominantSpan == 1 && hasOnlyStandardSpans) {
            version = 'v1.0';
            reasoning = `${dominantCount}/${componentCount} components span 1 interval`;
        } else if (dominantSpan == 5 && hasOnlyStandardSpans) {
            version = 'v2.0';
            reasoning = `${dominantCount}/${componentCount} components span 5 intervals`;
        } else if (hasUnitSpans && !hasFiveSpans) {
            // Has v1.0 components but no v2.0 components (may have other spans)
            version = 'v1.0';
            reasoning = `Mixed spans but contains v1.0-style 1-interval components`;
        } else if (hasFiveSpans && !hasUnitSpans) {
            // Has v2.0 components but no v1.0 components (may have other spans)
            version = 'v2.0';
            reasoning = `Mixed spans but contains v2.0-style 5-interval components`;
        } else {
            // Other unusual spans only - fallback
            version = 'v2.0';
            reasoning = `Ambiguous spans (dominant: ${dominantSpan}) - fallback to latest`;
        }

        return {
            version,
            confidence,
            componentCount,
            reasoning,
            spans: uniqueSpans,
            dominantSpan: parseInt(dominantSpan)
        };
    }
}
