// GUIDragElementCommand.js
import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";

export class DragElementCommand extends GUICommand {
  constructor(circuitService) {
    super();
    this.circuitService = circuitService;
    this.draggedElement = null;

    // Distinguishes "dragging entire shape" vs. "dragging a single node"
    this.draggingNodeIndex = null;

    // For storing initial offset and original position
    this.offset = { x: 0, y: 0 };
    this.nodeStartPos = { x: 0, y: 0 };

    // Axis lock: "horizontal", "vertical", or null
    this.dragAxis = null;

    // Snapping
    this.enableSnapping = true;
    this.gridSpacing = 10;

    // If you want an immediate lock with no threshold, set below to 0
    // or to 2, 5, etc. if you want to require some minimal difference
    this.LOCK_THRESHOLD = 2;
  }

  /**
   * Called on mousedown to see if we clicked on:
   * 1) A wire node => single-node drag, locked horizontally/vertically.
   * 2) A wire body => drag entire wire.
   * 3) Another element => drag entire shape only (no node-level dragging).
   */
  start(mouseX, mouseY) {
    for (const element of this.circuitService.getElements()) {
      // If it's a wire, see if user clicked near a node
      if (element.type === "wire") {
        const nodeIndex = this.findClosestNodeIndex(element, mouseX, mouseY);
        if (nodeIndex >= 0) {
          // We do single-node dragging
          this.draggedElement = element;
          this.draggingNodeIndex = nodeIndex;
          this.dragAxis = null; // not locked yet

          // Record offset and the node's original pos
          const node = element.nodes[nodeIndex];
          this.offset.x = mouseX - node.x;
          this.offset.y = mouseY - node.y;
          this.nodeStartPos.x = node.x;
          this.nodeStartPos.y = node.y;
          return;
        }
      }

      // If we either have a wire but user clicked not near a node,
      // or a non-wire element => see if we clicked the line or shape
      if (this.isInsideElement(mouseX, mouseY, element)) {
        this.draggedElement = element;
        this.draggingNodeIndex = null; // entire shape
        this.dragAxis = null;

        // If there's at least one node, measure offset from the first
        if (Array.isArray(element.nodes) && element.nodes.length > 0) {
          const [startNode] = element.nodes;
          this.offset.x = mouseX - startNode.x;
          this.offset.y = mouseY - startNode.y;
        }
        return;
      }
    }
  }

  /**
   * Called on mousemove to either drag a single node (wire) or the entire element.
   */
  move(mouseX, mouseY) {
    if (!this.draggedElement) return;

    // Ensure we have a valid array of nodes
    if (
      !Array.isArray(this.draggedElement.nodes) ||
      this.draggedElement.nodes.length === 0
    ) {
      return;
    }

    // 1) If we're dragging a single node (wire only)
    if (this.draggingNodeIndex !== null) {
      const node = this.draggedElement.nodes[this.draggingNodeIndex];

      // Snap
      let intendedX = mouseX - this.offset.x;
      let intendedY = mouseY - this.offset.y;
      if (this.enableSnapping) {
        intendedX = Math.round(intendedX / this.gridSpacing) * this.gridSpacing;
        intendedY = Math.round(intendedY / this.gridSpacing) * this.gridSpacing;
      }

      // If we haven't identified the wire orientation yet, do so now.
      //   We identify the wire orientation by comparing the two nodes of the wire.
      //   1) 'node' being dragged,
      //   2) 'otherNode'
      if (!this.dragAxis && this.draggedElement.nodes.length === 2) {
        // Identify which node is NOT being dragged
        const otherNodeIndex = this.draggingNodeIndex === 0 ? 1 : 0;
        const otherNode = this.draggedElement.nodes[otherNodeIndex];

        // See if the wire is "more horizontal" or "more vertical" initially
        // by comparing x-distance vs. y-distance
        const wireDx = otherNode.x - node.x;
        const wireDy = otherNode.y - node.y;

        if (Math.abs(wireDx) >= Math.abs(wireDy)) {
          this.dragAxis = "horizontal";
        } else {
          this.dragAxis = "vertical";
        }
      }

      // If we already determined an axis (or just did above), lock movement
      if (this.dragAxis === "horizontal") {
        intendedY = node.y; // Keep Y fixed to the wire’s current Y
      } else if (this.dragAxis === "vertical") {
        intendedX = node.x; // Keep X fixed to the wire’s current X
      }

      // Update the node
      node.x = intendedX;
      node.y = intendedY;
    }
    // 2) Otherwise, we're dragging the entire shape
    else {
      const firstNode = this.draggedElement.nodes[0];
      let intendedX = mouseX - this.offset.x;
      let intendedY = mouseY - this.offset.y;

      if (this.enableSnapping) {
        intendedX = Math.round(intendedX / this.gridSpacing) * this.gridSpacing;
        intendedY = Math.round(intendedY / this.gridSpacing) * this.gridSpacing;
      }

      const deltaX = intendedX - firstNode.x;
      const deltaY = intendedY - firstNode.y;

      // Shift all nodes
      this.draggedElement.nodes = this.draggedElement.nodes.map(
        (n) => new Position(n.x + deltaX, n.y + deltaY),
      );
    }

    // Emit update
    this.circuitService.emit("update", {
      type: "dragElement",
      element: this.draggedElement,
    });
  }

  stop() {
    this.draggedElement = null;
    this.draggingNodeIndex = null;
    this.dragAxis = null; // reset axis for next time
  }

  /**
   * If the user is dragging a wire, we see if they clicked near a node.
   */
  findClosestNodeIndex(element, mouseX, mouseY) {
    if (!Array.isArray(element.nodes)) return -1;
    const auraSize = 10;
    let closestIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < element.nodes.length; i++) {
      const node = element.nodes[i];
      const dist = Math.hypot(mouseX - node.x, mouseY - node.y);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }
    return minDist <= auraSize ? closestIndex : -1;
  }

  /**
   * Helper method to check if the user clicked near the "line" of an element.
   * This is the same logic you already had, expanded for clarity.
   */
  isInsideElement(worldX, worldY, element) {
    const auraSize = 10; // The clickable "fudge factor"

    // If nodes is missing or fewer than 2, skip line distance checks
    if (!Array.isArray(element.nodes) || element.nodes.length < 2) {
      return false;
    }

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
          end.y * start.x,
      ) / lineLength;

    // 3) Allow "inside" if within auraSize of the line
    return distance <= auraSize;
  }
}
