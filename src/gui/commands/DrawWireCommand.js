import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";

/**
 * DrawWireCommand:
 * - Begins on first click (start node).
 * - As user drags, draws a second node in locked horizontal or vertical direction.
 * - No direction changes once locked.
 * - Snaps to grid.
 */
export class DrawWireCommand extends GUICommand {
  constructor(circuitService, elementRegistry) {
    super();
    this.circuitService = circuitService;
    this.elementRegistry = elementRegistry;

    // Canvas -> world transform
    this.rendererOffsetX = 0;
    this.rendererOffsetY = 0;
    this.rendererScale = 1;

    // For wire drawing
    this.drawing = false;       // True once user places first node
    this.wireElement = null;    // The wire we’re creating
    this.direction = null;      // 'horizontal' or 'vertical' (locked once user moves)
    
    // Grid snapping
    this.enableSnapping = true;
    this.gridSpacing = 10;
  }

  /**
   * If your renderer’s pan/zoom changes, call this so we can invert those transforms.
   */
  setViewTransform(offsetX, offsetY, scale) {
    this.rendererOffsetX = offsetX;
    this.rendererOffsetY = offsetY;
    this.rendererScale = scale;
  }

  /**
   * Called when user initially clicks on the canvas to place the start node.
   */
  start(mouseX, mouseY) {
    // 1) Convert to world coords
    const worldX = (mouseX - this.rendererOffsetX) / this.rendererScale;
    const worldY = (mouseY - this.rendererOffsetY) / this.rendererScale;

    // 2) Snap to grid if needed
    const snappedX = this.enableSnapping
      ? Math.round(worldX / this.gridSpacing) * this.gridSpacing
      : worldX;
    const snappedY = this.enableSnapping
      ? Math.round(worldY / this.gridSpacing) * this.gridSpacing
      : worldY;

    // 3) Create a new wire entity with two identical nodes to start
    const wireFactory = this.elementRegistry.get("Wire");
    if (!wireFactory) {
      console.error("No wire factory registered.");
      return;
    }
    
    this.wireElement = wireFactory(
      undefined, // auto-generate ID
      [new Position(snappedX, snappedY), new Position(snappedX, snappedY)],
      null,
      {} // properties
    );

    // 4) Add it to the circuit
    this.circuitService.addElement(this.wireElement);

    // 5) We’re now in “drawing” mode
    this.drawing = true;
    this.direction = null; // not locked yet
  }

  /**
   * Called on mousemove to update the second node in a locked horizontal or vertical line.
   */
  move(mouseX, mouseY) {
    if (!this.drawing || !this.wireElement) return;

    // 1) Convert to world coords
    const worldX = (mouseX - this.rendererOffsetX) / this.rendererScale;
    const worldY = (mouseY - this.rendererOffsetY) / this.rendererScale;

    // 2) Snap to grid
    let snappedX = this.enableSnapping
      ? Math.round(worldX / this.gridSpacing) * this.gridSpacing
      : worldX;
    let snappedY = this.enableSnapping
      ? Math.round(worldY / this.gridSpacing) * this.gridSpacing
      : worldY;

    const [start, end] = this.wireElement.nodes;

    // 3) If we haven’t locked direction yet, see which axis changed more
    if (!this.direction) {
      const diffX = Math.abs(snappedX - start.x);
      const diffY = Math.abs(snappedY - start.y);

      if (diffX > diffY) {
        this.direction = "horizontal";
      } else if (diffY > diffX) {
        this.direction = "vertical";
      } else {
        // If they’re exactly the same, we can wait or default to horizontal
        this.direction = "horizontal"; // pick your preference
      }
    }

    // 4) Once direction is chosen, override the other coordinate with the start’s
    if (this.direction === "horizontal") {
      // Keep Y the same as the start node
      snappedY = start.y;
    } else {
      // Keep X the same as the start node
      snappedX = start.x;
    }

    // 5) Update the wire’s second node
    end.x = snappedX;
    end.y = snappedY;

    // 6) Emit update so the UI re-renders
    this.circuitService.emit("update", {
      type: "drawWire",
      wire: this.wireElement,
    });
  }

  /**
   * Called on mouseup (or second click) to finalize the wire.
   */
  stop() {
    if (this.drawing) {
      this.drawing = false;
      this.direction = null;
      this.wireElement = null;
    }
  }
}
