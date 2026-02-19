/**
 * @module Application/Services
 * @description
 * ⚡ **Application Layer - Circuit Services**
 *
 * Application services that orchestrate domain operations and provide the main API
 * for circuit manipulation. These services act as the primary interface between
 * the GUI layer and the domain logic.
 */

import { EventEmitter } from "../utils/EventEmitter.js";
import { Circuit } from "../domain/aggregates/Circuit.js";
import { Element } from "../domain/entities/Element.js";
import { generateId } from "../utils/idGenerator.js";
import { ElementRegistry } from "../config/registry.js";
import { Position } from "../domain/valueObjects/Position.js";
import { Properties } from "../domain/valueObjects/Properties.js";
import { Label } from "../domain/valueObjects/Label.js";
import { Logger } from "../utils/Logger.js";
import { GRID_SPACING } from "../config/gridConfig.js";

/**
 * @class CircuitService
 * @extends EventEmitter
 * @description
 * **🔧 Primary Extension API - Circuit Operations**
 *
 * CircuitService is the main application service that developers will interact with
 * to programmatically manipulate circuits. It provides a clean, event-driven API
 * for all circuit operations while maintaining domain integrity.
 *
 * **Key Features:**
 * - Event-driven architecture with real-time GUI updates
 * - Domain validation and business rule enforcement
 * - Element lifecycle management (add, update, delete)
 * - Circuit state serialization and persistence
 * - Undo/redo support through state management
 *
 * **Events Emitted:**
 * - `elementAdded`: When a new element is added
 * - `elementDeleted`: When an element is removed
 * - `elementUpdated`: When element properties change
 * - `update`: General circuit state change notification
 *
 * @example
 * // Basic circuit manipulation
 * const service = new CircuitService(new Circuit());
 *
 * // Listen for changes
 * service.on('elementAdded', (element) => {
 *   console.log(`Added ${element.type} ${element.id}`);
 * });
 *
 * // Add elements
 * const resistor = new Resistor('R1', [pos1, pos2], null, new Properties({resistance: 1000}));
 * service.addElement(resistor);
 *
 * @example
 * // Advanced usage with properties
 * service.updateElementProperties('R1', {
 *   resistance: 2200,
 *   label: 'Main Resistor'
 * });
 *
 * const serialized = service.exportState();
 * service.importState(serialized);
 */
export class CircuitService extends EventEmitter {
  /**
   * Constructs a new CircuitService.
   *
   * @param {Circuit} circuit - The circuit aggregate to manage.
   */
  constructor(circuit, elementRegistry) {
    super(); // Extend EventEmitter functionality
    /**
     * The circuit aggregate representing the current circuit design.
     * @type {Circuit}
     * @type {ElementRegistry}
     */
    this.circuit = circuit;
    this.elementRegistry = elementRegistry;
    this.on("commandExecuted", (event) => {
      if (event.type === "addElement") {
        try {
          const elementFactory = this.elementRegistry.get(event.elementType);
          if (!elementFactory) {
            throw new Error(
              ` No factory registered for element type: ${event.elementType}`,
            );
          }

          // Ensure event.nodes is an array of Position instances
          if (!Array.isArray(event.nodes)) {
            throw new Error(" Nodes must be provided as an array.");
          }

          // We translate node payloads from the event into Position instances
          const nodes = event.nodes.map((node) => new Position(node.x, node.y)); //  Convert to Position instances

          // We translate properties payloads into instances of Propertiies
          const properties = event.properties
            ? new Properties(event.properties)
            : new Properties(); //  Convert to Properties instance

          // Correctly call the factory function
          const newElement = elementFactory(
            undefined, // Auto-generate ID
            nodes, // Correct nodes
            null, // Label (default to null)
            properties, // Properties (default to empty object)
          );

          this.addElement(newElement);
        } catch (error) {
          Logger.error(`Error creating element: ${error.message}`);
        }
      }
    });
  }

  /**
   * Adds an element to the circuit after validation.
   *
   * Delegates validation to the Circuit aggregate to ensure that the element
   * adheres to all circuit-level rules, such as uniqueness of element ID and
   * non-conflicting node positions.
   *
   * Emits an **"update" event** after successfully adding the element.
   *
   * @param {Element} element - The element to add.
   * @throws {Error} If the element violates circuit rules.
   */
  addElement(element) {
    // Generate an ID if the element does not already have one
    if (!element.id) {
      const prefix = element.type.charAt(0).toUpperCase(); // e.g., "R" for Resistor
      element.id = generateId(prefix);
    }

    this.circuit.validateAddElement(element); // Delegate validation to Circuit
    this.circuit.elements.push(element); // Add the element to the circuit

    // Notify subscribers (GUI, renderers) about the update
    this.emit("update", { type: "addElement", element });
  }

  /**
   * Deletes an element from the circuit.
   *
   * Removes the element from the list of elements and updates any connections
   * involving the deleted element.
   *
   * Emits an **"update" event** after successfully deleting the element.
   *
   * @param {string} elementId - The unique ID of the element to delete.
   */
  deleteElement(elementId) {
    const element = this.circuit.elements.find((el) => el.id === elementId);
    if (!element) {
      return;
    }

    // Remove the element from the circuit
    this.circuit.elements = this.circuit.elements.filter(
      (el) => el.id !== elementId,
    );

    // Update connections after deletion
    for (const [key, connectedElements] of this.circuit.connections.entries()) {
      const updatedConnections = connectedElements.filter(
        (el) => el.id !== elementId,
      );
      if (updatedConnections.length === 0) {
        this.circuit.connections.delete(key); // Remove empty connections
      } else {
        this.circuit.connections.set(key, updatedConnections); // Update connections
      }
    }

    // Notify subscribers about the update
    this.emit("update", { type: "deleteElement", elementId });
  }

  /**
   * Connects two elements in the circuit if the connection is valid.
   *
   * Delegates validation to the Circuit aggregate and establishes the connection
   * if the rules are met.
   *
   * Emits an **"update" event** after successfully connecting the elements.
   *
   * @param {Element} element1 - The first element to connect.
   * @param {Element} element2 - The second element to connect.
   * @throws {Error} If the connection violates circuit rules.
   */
  connectElements(element1, element2) {
    this.circuit.validateConnection(element1, element2); // Delegate to Circuit
    this.circuit.connections.set(element1.id, [
      ...(this.circuit.connections.get(element1.id) || []),
      element2,
    ]);
    this.circuit.connections.set(element2.id, [
      ...(this.circuit.connections.get(element2.id) || []),
      element1,
    ]);

    // Notify subscribers about the update
    this.emit("update", {
      type: "connectElements",
      elements: [element1, element2],
    });
  }

  /**
   * Finds all elements connected to a given element.
   *
   * Searches through the circuit's connections map to identify and return
   * all elements that share a connection with the specified element.
   *
   * @param {Element} element - The element whose connections to find.
   * @returns {Element[]} List of connected elements.
   */
  findConnections(element) {
    const connectedElements = [];
    for (const [key, elements] of this.circuit.connections.entries()) {
      if (elements.includes(element)) {
        connectedElements.push(...elements.filter((el) => el !== element));
      }
    }
    return connectedElements;
  }

  /**
   * Retrieves all elements in the circuit.
   *
   * This is a simple delegate method to provide read-only access
   * to the elements of the circuit aggregate.
   *
   * @returns {Element[]} The list of elements in the circuit.
   */
  getElements() {
    return [...this.circuit.elements]; // Return a shallow copy to avoid direct modification
  }

  /**
   * Gets a specific element by its ID.
   *
   * @param {string} elementId - The ID of the element to find.
   * @returns {Element|null} The element with the given ID, or null if not found.
   */
  getElementByID(elementId) {
    return this.circuit.elements.find(el => el.id === elementId) || null;
  }

  /**
   * Updates properties and label of an existing element through the service.
   * This maintains proper aggregate boundary and ensures state consistency.
   *
   * @param {string} elementId - The ID of the element to update.
   * @param {Object} newProperties - Object containing new property values and label.
   * @returns {boolean} True if element was found and updated, false otherwise.
   */
    updateElementProperties(elementId, newProperties) {
        try {
            const element = this.getElementByID(elementId);
            if (!element) {
                console.error(`Element with ID ${elementId} not found`);
                return false;
            }

            // Update the label if provided
            if (newProperties.label !== undefined) {
                if (newProperties.label === null || newProperties.label === '') {
                    element.label = null;
                } else {
                    element.label = new Label(newProperties.label);
                }
            }

            // Update other properties
            Object.keys(newProperties).forEach(key => {
                if (key !== 'label') {
                    element.getProperties().updateProperty(key, newProperties[key]);
                }
            });

            // Emit update to trigger canvas re-render
            this.emit("update", { type: "updateElementProperties", elementId, newProperties });

            return true;
        } catch (error) {
            console.error('Error updating element properties:', error);
            return false;
        }
    }  /**
   * Serializes the entire state of the circuit for undo/redo or persistence.
   *
   * @returns {string} A JSON string representing the circuit state.
   */
  exportState() {
    return JSON.stringify({
      elements: this.circuit.elements.map((el) => ({
        id: el.id,
        type: el.type,
        label: el.label ? el.label.value : null, //  Export label value, not Label object
        nodes: el.nodes.map((pos) => ({ x: pos.x, y: pos.y })),
        properties: { ...el.properties.values }, //  flatten properties
      }))
    });
  }

  /**
   * Restores the state of the circuit from a previously exported snapshot.
   *
   * @param {string} snapshot - A JSON string created by exportState().
   */
  importState(snapshot) {
    const data = JSON.parse(snapshot);

    // Reset circuit state
    this.circuit.elements = [];

    // Reconstruct elements
    const elementsById = {};
    for (const elData of data.elements) {

      // Direct lookup - element.type matches registry key (both lowercase)
      const factory = this.elementRegistry.get(elData.type);
      if (!factory) throw new Error(`No factory for type ${elData.type}`);

      const nodes = elData.nodes.map((n) => new Position(n.x, n.y));

      //  Safely flatten nested "values" if present
      const rawProps = elData.properties ?? {};
      const cleanProps =
        rawProps &&
        typeof rawProps.values === "object" &&
        rawProps.values !== null
          ? rawProps.values
          : rawProps;

      const properties = new Properties(cleanProps);

      // Create Label object from label string if present
      const labelObj = elData.label ? new Label(elData.label) : null;

      const el = factory(elData.id, nodes, labelObj, properties);
      elementsById[el.id] = el;
      this.circuit.elements.push(el);
    }

    this.emit("update", { type: "restoredFromSnapshot" });
  }

  /**
   * Rotates a group of elements.
   * - Single element: node[0] is the fixed anchor, node[1] swings around it
   *   in 90° increments (QuCat convention). Result is snapped to grid.
   * - Multiple elements: rotates around the centre of their combined bounding box.
   * 
   * @param {string[]} elementIds - Array of element IDs to rotate.
   * @param {number} rotationAngleDegrees - The rotation angle in degrees (90, -90, 180, etc.).
   */
  rotateElements(elementIds, rotationAngleDegrees) {
    if (!elementIds || elementIds.length === 0) {
      console.warn("No elements provided for rotation");
      return;
    }

    const elements = elementIds.map(id => 
      this.circuit.elements.find(el => el.id === id)
    ).filter(el => el !== undefined);

    if (elements.length === 0) {
      console.warn("No valid elements found for rotation");
      return;
    }

    // Convert rotation angle to radians
    const rotationAngle = (rotationAngleDegrees * Math.PI) / 180;
    const cos = Math.round(Math.cos(rotationAngle));  // exact for 90° multiples
    const sin = Math.round(Math.sin(rotationAngle));

    if (elements.length === 1 && elements[0].nodes.length >= 2) {
      // ── Single element: anchor at node[0], rotate node[1] around it ──
      const el = elements[0];
      const anchor = el.nodes[0];                       // stays fixed

      for (let i = 1; i < el.nodes.length; i++) {
        const relX = el.nodes[i].x - anchor.x;
        const relY = el.nodes[i].y - anchor.y;

        const rotX = relX * cos - relY * sin;
        const rotY = relX * sin + relY * cos;

        // Snap to grid
        el.nodes[i].x = Math.round((anchor.x + rotX) / GRID_SPACING) * GRID_SPACING;
        el.nodes[i].y = Math.round((anchor.y + rotY) / GRID_SPACING) * GRID_SPACING;
      }
    } else {
      // ── Multiple elements: rotate around bounding-box centre ──
      const bb = this.calculateBoundingBox(elements);
      const cx = (bb.minX + bb.maxX) / 2;
      const cy = (bb.minY + bb.maxY) / 2;

      elements.forEach(element => {
        element.nodes.forEach(node => {
          const relX = node.x - cx;
          const relY = node.y - cy;

          node.x = Math.round((cx + relX * cos - relY * sin) / GRID_SPACING) * GRID_SPACING;
          node.y = Math.round((cy + relX * sin + relY * cos) / GRID_SPACING) * GRID_SPACING;
        });
      });
    }

    // Update orientation property on every rotated element
    elements.forEach(element => {
      const cur = element.properties?.values?.orientation || 0;
      const next = ((cur + rotationAngleDegrees) % 360 + 360) % 360;
      if (element.properties && element.properties.updateProperty) {
        element.properties.updateProperty('orientation', next);
      }
    });
    
    this.emit("update", { type: "rotateElements", elementIds, rotationAngleDegrees });
  }

  /**
   * Calculates the bounding box for a group of elements.
   * 
   * @param {Element[]} elements - Array of elements to calculate bounding box for.
   * @returns {Object} Bounding box with minX, minY, maxX, maxY properties.
   */
  calculateBoundingBox(elements) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      element.nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
      });
    });

    return { minX, minY, maxX, maxY };
  }

  /**
   * Rotates a single element to a new absolute orientation.
   * Rotates around the midpoint of its two nodes and snaps to grid.
   * 
   * @param {string} elementId - The unique identifier of the element to rotate.
   * @param {number} newOrientation - The target orientation (0, 90, 180, or 270 degrees).
   */
  rotateElement(elementId, newOrientation) {
    const element = this.circuit.elements.find(el => el.id === elementId);
    if (!element) return;
    
    const currentOrientation = element?.properties?.values?.orientation || 0;
    const rotationAngleDeg = newOrientation - currentOrientation;
    
    // Delegate to rotateElements (single-element path uses midpoint + grid snap)
    this.rotateElements([elementId], rotationAngleDeg);
  }

  /**
   * Moves an element to a new position.
   * 
   * @param {string} elementId - The unique identifier of the element to move.
   * @param {Position} newPosition - The new position for the reference terminal.
   */
  moveElement(elementId, newPosition) {
    const element = this.circuit.elements.find(el => el.id === elementId);
    if (!element) {
      console.warn(`Element with ID ${elementId} not found for move`);
      return;
    }

    // Import ElementService dynamically to avoid circular dependencies
    import('./ElementService.js').then(({ ElementService }) => {
      ElementService.move(element, newPosition);
      this.emit("update", { type: "moveElement", elementId, newPosition });
    }).catch(error => {
      console.error("Error importing ElementService for move:", error);
    });
  }
}
