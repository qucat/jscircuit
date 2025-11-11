import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { ElementFactory } from "../../domain/factories/ElementFactory.js";
import { Properties } from "../../domain/valueObjects/Properties.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";
import { CoordinateAdapter } from "../../infrastructure/adapters/CoordinateAdapter.js";

/**
 * Command to add an element to the circuit with proper grid-based sizing
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

    // Defaults for positioning - ensure they're grid-aligned
    const defaultPos = new Position(400, 300);
    const snappedDefaults = CoordinateAdapter.snapToGrid(defaultPos);
    this.DEFAULT_X = snappedDefaults.x;
    this.DEFAULT_Y = snappedDefaults.y;
    
    // Store current mouse position for placement mode
    this.currentMousePosition = null;
  }
  
  /**
   * Set the current mouse position for placement
   * @param {Object} mousePosition - Object with x and y coordinates
   */
  setMousePosition(mousePosition) {
    this.currentMousePosition = mousePosition;
  }

  /**
   * Executes the command, creating an element with proper grid-based sizing.
   * For 2-node components, creates nodes that span exactly 5 grid intervals (50 pixels).
   * Mouse position is snapped to logical grid for proper alignment.
   *
   * @param {Array<{x: number, y: number}>} customNodes - Optional custom node positions (for testing)
   */
  execute(customNodes = null) {
    let positions;
    
    if (customNodes && customNodes.length > 0) {
      // Use custom nodes directly (for testing and backward compatibility)
      if (this.gridSpacing && this.enableSnapping !== false) {
        // Apply grid snapping if gridSpacing is set and snapping is enabled
        positions = customNodes.map(node => new Position(
          Math.round(node.x / this.gridSpacing) * this.gridSpacing,
          Math.round(node.y / this.gridSpacing) * this.gridSpacing
        ));
        console.log('[AddElementCommand] Using custom nodes with snapping:', customNodes, '→', positions.map(p => ({ x: p.x, y: p.y })));
      } else {
        // Use custom nodes without snapping
        positions = customNodes.map(node => new Position(node.x, node.y));
        console.log('[AddElementCommand] Using custom nodes:', customNodes);
      }
    } else {
      // Calculate positions using grid logic (normal operation)
      let centerX, centerY;
      
      if (this.currentMousePosition) {
        // Snap mouse position to logical grid first
        const snappedPixelPos = CoordinateAdapter.snapToGrid(this.currentMousePosition);
        centerX = snappedPixelPos.x;
        centerY = snappedPixelPos.y;
        console.log('[AddElementCommand] Using mouse position:', this.currentMousePosition, '→ snapped:', { x: centerX, y: centerY });
      } else {
        // Use grid-aligned default position
        centerX = this.DEFAULT_X;
        centerY = this.DEFAULT_Y;
        console.log('[AddElementCommand] Using default position:', { x: centerX, y: centerY });
      }

      // Calculate node positions using grid configuration
      // This ensures 2-node components span exactly 5 grid intervals (50 pixels)
      const nodePositions = GRID_CONFIG.calculateNodePositions(centerX, centerY, 0); // 0 degrees initially
      
      console.log('[AddElementCommand] Node positions calculated:', nodePositions);
      
      positions = [
        new Position(nodePositions.start.x, nodePositions.start.y),
        new Position(nodePositions.end.x, nodePositions.end.y)
      ];
    }
    
    // Create Properties instance with default orientation for all elements
    const properties = new Properties({ orientation: 0 });
    
    // Use ElementFactory.create with correct parameter order
    const element = ElementFactory.create(this.elementType, undefined, positions, properties, null);

    console.log('[AddElementCommand] Created element with nodes:', element.nodes.map(n => ({ x: n.x, y: n.y })));

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
