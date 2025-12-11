/**
 * @class Circuit
 * @description
 * Domain aggregate representing a complete circuit design in the QuCat Circuit Generator.
 *
 * This is the core aggregate in our Domain-Driven Design architecture that maintains
 * the integrity of a circuit by managing elements and their connections. It enforces
 * business rules such as element uniqueness and connection validity.
 *
 * **Key Responsibilities:**
 * - Manage circuit elements (resistors, capacitors, wires, etc.)
 * - Validate element additions and connections
 * - Maintain connection mapping between elements
 * - Enforce domain business rules and constraints
 *
 * **Aggregate Root Pattern:**
 * As an aggregate root, Circuit is the only way to access and modify circuit elements.
 * All mutations must go through this aggregate to maintain consistency.
 *
 * @example
 * const circuit = new Circuit();
 * const resistor = new Resistor('R1', [pos1, pos2], null, new Properties({resistance: 1000}));
 * circuit.validateAddElement(resistor);
 * circuit.addElement(resistor);
 */
export class Circuit {
    /**
     * Creates a new empty circuit.
     *
     * Initializes the circuit with empty collections for elements and connections.
     * The circuit starts in a valid state with no elements or connections.
     */
    constructor() {
        this.elements = []; // List of all elements in the circuit
        this.connections = new Map(); // Map of node positions to connected elements
    }

    /**
     * Validates whether an element can be added to the circuit.
     *
     * @param {Element} element - The element to validate.
     * @throws {Error} If the element violates circuit rules.
     */
    validateAddElement(element) {
        // Check that the element is unique
        if (this.elements.some(el => el.id === element.id)) {
            throw new Error(`Element with id ${element.id} is already in the circuit.`);
        }
    }

    /**
     * Validates and establishes a connection between two elements in the circuit.
     * This method handles two types of connections:
     * - Node-to-Node connections: Direct connections between nodes of two elements.
     * - Node-to-Wire-Body connections: A node connecting to any point along a wire's body.
     *
     * @param {Element} element1 - The first element to connect.
     * @param {Element} element2 - The second element to connect.
     * @throws {Error} If the connection violates circuit rules.
     */
    validateConnection(element1, element2) {
        // Handle node-to-node connections
        const element1NodeKeys = new Set(element1.nodes.map(node => `${node.x},${node.y}`));
    
        for (const node of element2.nodes) {
            const key = `${node.x},${node.y}`;
    
            if (element1NodeKeys.has(key)) {
                const connectedElements = this.connections.get(key) || [];
    
                // Check if the node is already connected to other elements
                const isAlreadyConnected = connectedElements.some(
                    connectedElement => connectedElement !== element1 && connectedElement !== element2
                );
    
                if (isAlreadyConnected) {
                    throw new Error(
                        `Node at position (${node.x}, ${node.y}) is already connected and cannot accept additional connections.`
                    );
                }
    
                // Add the connection
                if (!this.connections.has(key)) {
                    this.connections.set(key, []);
                }
                this.connections.get(key).push(element1, element2);
            }
        }
    
        // Handle node-to-wire-body connections
        const wire = element1.type === 'wire' ? element1 : element2.type === 'wire' ? element2 : null;
        const node = element1.type === 'wire' ? element2.nodes[0] : element1.nodes[0];
    
        if (wire && node) {
            // Check if the node lies on any segment of the wire
            for (let i = 0; i < wire.nodes.length - 1; i++) {
                const start = wire.nodes[i];
                const end = wire.nodes[i + 1];
    
                if (this.isNodeOnWireSegment(node, start, end)) {
                    const key = `${node.x},${node.y}`;
                    const connectedElements = this.connections.get(key) || [];
    
                    // Ensure no duplicate connections
                    if (connectedElements.some(e => e === node)) {
                        throw new Error(`Node at position (${node.x}, ${node.y}) is already connected and cannot accept additional connections.`);
                    }
    
                    if (!this.connections.has(key)) {
                        this.connections.set(key, []);
                    }
                    this.connections.get(key).push(wire, node);
                    return; // Exit after finding a valid connection
                }
            }
        }
    }

    /**
     * Checks if a node lies on the body of a wire, defined by a line segment between two endpoints.
     *
     * This method is used to validate node-to-wire-body connections in a circuit.
     * It ensures that a node is either at one of the wire's terminal positions
     * or lies along any of the wire's intermediate line segments.
     *
     * @param {Position} node - The node to check.
     * @param {Position} wireStart - The starting point of the wire's line segment.
     * @param {Position} wireEnd - The ending point of the wire's line segment.
     * @returns {boolean} True if the node lies on the wire's line segment, otherwise false.
     */
    isNodeOnWireSegment(node, wireStart, wireEnd) {
        // Check if the node lies within the bounding box of the segment
        if (
            node.x < Math.min(wireStart.x, wireEnd.x) || node.x > Math.max(wireStart.x, wireEnd.x) ||
            node.y < Math.min(wireStart.y, wireEnd.y) || node.y > Math.max(wireStart.y, wireEnd.y)
        ) {
            return false;
        }

        // Use the collinearity condition: (y2 - y1) * (x - x1) == (y - y1) * (x2 - x1)
        const crossProduct = (wireEnd.y - wireStart.y) * (node.x - wireStart.x) - (node.y - wireStart.y) * (wireEnd.x - wireStart.x);

        // Check if the cross product is close to zero (to account for floating-point precision)
        if (Math.abs(crossProduct) > 1e-10) {
            return false;
        }

        return true;
    }

    /**
     * Serializes the circuit elements into a format suitable for export or persistence.
     *
     * This method converts all circuit elements into a plain JavaScript object format
     * that can be easily serialized to JSON or other data formats. It's primarily used
     * by export adapters like QucatNetlistAdapter for file operations.
     *
     * @returns {Object[]} Array of serialized element objects, each containing:
     *   - {string} id - The unique element identifier
     *   - {string} type - The element type (resistor, capacitor, wire, etc.)
     *   - {Object[]} nodes - Array of node positions as {x, y} objects
     *   - {Object} properties - Element properties as key-value pairs
     *   - {string|null} label - Element label text or null if no label
     *
     * @example
     * const serialized = circuit.getSerializedElements();
     * console.log(serialized[0]); // { id: 'R1', type: 'resistor', nodes: [{x: 10, y: 20}], ... }
     */
    getSerializedElements() {
        return this.elements.map(el => ({
            id: el.id,
            type: el.type,
            nodes: el.nodes.map(p => ({ x: p.x, y: p.y })),
            properties: el.properties.values,
            label: el.label ? el.label.value : null
        }));
    }
}
