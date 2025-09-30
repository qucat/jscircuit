import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { ElementFactory } from "../../domain/factories/ElementFactory.js";
import { Properties } from "../../domain/valueObjects/Properties.js";
/**
 *
 * @param {CircuitService} circuitService - The circuit service to use.
 * @param {CircuitRenderer} circuitRenderer - The circuit renderer to use.
 * @param {ElementRegistry} elementRegistry - The element registry to use.
 * @param {string} elementType - The element type
 *
 * return {AddElementCommand}
 */
export class AddElementCommand extends GUICommand {
  constructor(circuitService, circuitRenderer, elementRegistry, elementType) {
    super();
    this.circuitService = circuitService;
    this.circuitRenderer = circuitRenderer;
    this.elementRegistry = elementRegistry;
    this.elementType = elementType;

    // Defaults for positioning (in logical coordinates)
    this.DEFAULT_X = 400;
    this.DEFAULT_Y = 300;
    this.ELEMENT_WIDTH = 50; // This should not be a constant because element sizes might differ.

    // Snapping configuration (assumed to be provided from UI, e.g., via GUIAdapter)
    this.enableSnapping = true; // Optionally turn snapping on/off
    this.gridSpacing = 10; // Grid spacing in logical coordinates
  }

  /**
   * Executes the command, snapping the primary node (first node) to the nearest grid point.
   * All other nodes are adjusted relative to the snapped primary node.
   * @param {Array} nodes - An array of objects with {x, y} coordinates.
   */
execute(nodes = null) {
  // Use ElementFactory.create instead of calling the factory directly
  // This ensures proper parameter order and type checking
  
  // Set up default nodes if none provided
  const defaultNodes = (Array.isArray(nodes) && nodes.length > 0) ? nodes : [
    { x: this.DEFAULT_X, y: this.DEFAULT_Y },
    { x: this.DEFAULT_X + this.ELEMENT_WIDTH, y: this.DEFAULT_Y },
  ];

  // Snap nodes to grid if enabled
  const snappedNodes = this.enableSnapping
    ? defaultNodes.map(n => ({
      x: Math.round(n.x / this.gridSpacing) * this.gridSpacing,
      y: Math.round(n.y / this.gridSpacing) * this.gridSpacing,
    }))
    : defaultNodes;

  const positions = snappedNodes.map(pt => new Position(pt.x, pt.y));
  
  // Create Properties instance with default orientation for all elements
  const properties = new Properties({ orientation: 0 });
  
  // Use ElementFactory.create with correct parameter order
  const element = ElementFactory.create(this.elementType, undefined, positions, properties, null);

  // Add the element in "placement mode" (so it follows the mouse)
  this.circuitService.addElement(element);
  this.circuitService.emit("startPlacing", { element });
}

  /**
   * Undoes the add element command by removing the element from the circuit.
   */
  undo() {
    // Implementation would need to track the added element and remove it
    // For now, this is a placeholder
    console.log("Undo AddElementCommand not fully implemented yet");
  }
}
