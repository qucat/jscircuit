// GUIDragElementCommand.js
import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";

export class DragElementCommand extends GUICommand {
  constructor(circuitService) {
    super();
    this.circuitService = circuitService;
    this.draggedElement = null;
    this.offset = { x: 0, y: 0 };

    // New: Snapping settings (could be set externally)
    this.enableSnapping = true;  // default: true
    this.gridSpacing = 10;       // the value is pixels
  }

  /**
   * Called on mousedown to check if the user clicked on an element.
   * If so, prepare for dragging that element.
   */
  start(mouseX, mouseY) {
    for (const element of this.circuitService.getElements()) {
      if (this.isInsideElement(mouseX, mouseY, element)) {
        this.draggedElement = element;

        // We'll measure offset from the first node
        const [startNode] = element.nodes;
        this.offset.x = mouseX - startNode.x;
        this.offset.y = mouseY - startNode.y;
        return;
      }
    }
  }

  /**
   * Called repeatedly during mousemove, updating the element's position.
   */
  move(mouseX, mouseY) {
    if (!this.draggedElement) return;

    // 1) Compute the intended new "top-left" or first-node position
    let intendedX = mouseX - this.offset.x;
    let intendedY = mouseY - this.offset.y;

    // 2) If snapping is enabled, round to nearest grid spacing
    if (this.enableSnapping) {
      intendedX = Math.round(intendedX / this.gridSpacing) * this.gridSpacing;
      intendedY = Math.round(intendedY / this.gridSpacing) * this.gridSpacing;
    }

    // 3) Determine how far the first node must move
    const firstNode = this.draggedElement.nodes[0];
    const deltaX = intendedX - firstNode.x;
    const deltaY = intendedY - firstNode.y;

    // 4) Update *all* nodes by the same delta
    this.draggedElement.nodes = this.draggedElement.nodes.map((node) =>
      new Position(node.x + deltaX, node.y + deltaY)
    );

    // 5) Notify the UI that the element has moved
    this.circuitService.emit("update", {
      type: "moveElement",
      element: this.draggedElement
    });
  }

  /**
   * Called on mouseup to end the drag operation.
   */
  stop() {
    this.draggedElement = null;
  }

  /**
   * Helper method to check if the user clicked near the "line" of an element.
   * This is the same logic you already had, expanded for clarity.
   */
  isInsideElement(worldX, worldY, element) {
    const auraSize = 10; // The clickable "fudge factor"
    if (element.nodes.length < 2) return false;

    const [start, end] = element.nodes;
    const lineLength = Math.hypot(end.x - start.x, end.y - start.y);

    // If both nodes happen to be the same point, treat it like a "circle" check
    if (lineLength === 0) {
      return Math.hypot(worldX - start.x, worldY - start.y) <= auraSize;
    }

    // 1) Quick bounding-box check (with aura padding)
    const minX = Math.min(start.x, end.x) - auraSize;
    const maxX = Math.max(start.x, end.x) + auraSize;
    const minY = Math.min(start.y, end.y) - auraSize;
    const maxY = Math.max(start.y, end.y) + auraSize;

    // If outside the bounding box, no need to compute distance
    if (worldX < minX || worldX > maxX || worldY < minY || worldY > maxY) {
      return false;
    }

    // 2) Compute the perpendicular distance to the infinite line
    const distance =
      Math.abs(
        (end.y - start.y) * worldX -
        (end.x - start.x) * worldY +
        end.x * start.y -
        end.y * start.x
      ) / lineLength;

    // 3) Allow "inside" if within auraSize of the line
    return distance <= auraSize;
  }
}