import { EventEmitter } from "../utils/EventEmitter.js";
import { Circuit } from "../domain/aggregates/Circuit.js";
import { Element } from "../domain/entities/Element.js";
import { generateId } from "../utils/idGenerator.js";
import { ElementRegistry } from "../config/settings.js";
import { Position } from "../domain/valueObjects/Position.js";
import { Properties } from "../domain/valueObjects/Properties.js";

/**
 * CircuitService orchestrates operations on the Circuit aggregate,
 * ensuring high-level use cases like adding, deleting, and connecting elements
 * while delegating validation and low-level operations to the Circuit aggregate.
 *
 * Now, CircuitService acts as an EventEmitter, broadcasting events whenever
 * circuit changes occur. This enables an **event-driven UI**, where the GUI
 * updates in response to state changes.
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
          console.error(`Error creating element: ${error.message}`);
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
   * Serializes the entire state of the circuit for undo/redo or persistence.
   *
   * @returns {string} A JSON string representing the circuit state.
   */
  exportState() {
    return JSON.stringify({
      elements: this.circuit.elements.map((el) => ({
        id: el.id,
        type: el.type,
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
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const data = JSON.parse(snapshot);

    // Reset circuit state
    this.circuit.elements = [];

    // Reconstruct elements
    const elementsById = {};
    for (const elData of data.elements) {

      const factory = this.elementRegistry.get(capitalize(elData.type));
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

      const el = factory(elData.id, nodes, elData.label ?? null, properties);
      elementsById[el.id] = el;
      this.circuit.elements.push(el);
    }

    this.emit("update", { type: "restoredFromSnapshot" });
  }

  /**
   * Rotates a group of elements around the center of their bounding box.
   * 
   * @param {string[]} elementIds - Array of element IDs to rotate.
   * @param {number} rotationAngleDegrees - The rotation angle in degrees (90, 180, 270, etc.).
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

    // Calculate the bounding box of all selected elements
    const boundingBox = this.calculateBoundingBox(elements);
    
    // Calculate the center of the bounding box
    const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
    const centerY = (boundingBox.minY + boundingBox.maxY) / 2;
    
    // Convert rotation angle to radians
    const rotationAngle = (rotationAngleDegrees * Math.PI) / 180;
    
    // Rotate all nodes of all elements around the bounding box center
    elements.forEach(element => {
      element.nodes.forEach(node => {
        // Translate node to origin (relative to bounding box center)
        const relativeX = node.x - centerX;
        const relativeY = node.y - centerY;
        
        // Apply rotation matrix
        const cos = Math.cos(rotationAngle);
        const sin = Math.sin(rotationAngle);
        
        const rotatedX = relativeX * cos - relativeY * sin;
        const rotatedY = relativeX * sin + relativeY * cos;
        
        // Translate back to absolute coordinates
        node.x = centerX + rotatedX;
        node.y = centerY + rotatedY;
      });

      // Update the element's orientation property (for elements that track orientation)
      const currentOrientation = element.properties.values.orientation || 0;
      const newOrientation = (currentOrientation + rotationAngleDegrees) % 360;
      element.properties.updateProperty('orientation', newOrientation);
    });
    
    // Emit update to trigger immediate re-render
    this.emit("update", { type: "rotateElements", elementIds, rotationAngleDegrees, centerX, centerY });
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
   * Rotates an element to a new orientation.
   * 
   * @param {string} elementId - The unique identifier of the element to rotate.
   * @param {number} newOrientation - The new orientation (0, 90, 180, or 270 degrees).
   */
  rotateElement(elementId, newOrientation) {
    // Use the new group rotation method for single elements
    const currentOrientation = this.circuit.elements.find(el => el.id === elementId)?.properties.values.orientation || 0;
    const rotationAngle = newOrientation - currentOrientation;
    this.rotateElements([elementId], rotationAngle);
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
