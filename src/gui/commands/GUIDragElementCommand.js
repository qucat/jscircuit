import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";

/**
 * @class DragElementCommand
 * @extends GUICommand
 * @description
 * Handles GUI logic for dragging circuit elements, either fully (shape dragging)
 * or partially (dragging a specific node of a wire).
 * Integrates with WireSplitService to handle cases where a wire touches
 * a node or vice versa.
 */
export class DragElementCommand extends GUICommand {
  /**
   * @constructor
   * @param {CircuitService} circuitService - The service managing circuit logic.
   * @param {WireSplitService} wireSplitService - Handles wire-body and node-based splits.
   */
  constructor(circuitService, wireSplitService) {
    super();
    this.circuitService = circuitService;
    this.wireSplitService = wireSplitService;

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
   * Initiates a drag operation, determining whether the user clicked on a node or shape body.
   * @param {number} mouseX - X coordinate of mouse.
   * @param {number} mouseY - Y coordinate of mouse.
   */
  start(mouseX, mouseY) {
    for (const element of this.circuitService.getElements()) {
      // Case 1: Check if user clicked on a wire node
      if (element.type === "wire") {
        const nodeIndex = this.findClosestNodeIndex(element, mouseX, mouseY);
        if (nodeIndex >= 0) {
          this.draggedElement = element;
          this.draggingNodeIndex = nodeIndex;
          this.dragAxis = null;

          const node = element.nodes[nodeIndex];
          this.offset.x = mouseX - node.x;
          this.offset.y = mouseY - node.y;
          this.nodeStartPos.x = node.x;
          this.nodeStartPos.y = node.y;
          return;
        }
      }

      // Case 2: User clicked on a shape (or wire body)
      if (this.isInsideElement(mouseX, mouseY, element)) {
        this.draggedElement = element;
        this.draggingNodeIndex = null;
        this.dragAxis = null;

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
 * Handles mousemove events to drag the element or node.
 * @param {number} mouseX - X coordinate of mouse.
 * @param {number} mouseY - Y coordinate of mouse.
 */
move(mouseX, mouseY) {
  if (!this.draggedElement) return;
  if (!Array.isArray(this.draggedElement.nodes) || this.draggedElement.nodes.length === 0) return;

  // Branch 1: Dragging a wire node
  if (this.draggingNodeIndex !== null) {
    // Step 1: check if this node is shared across multiple elements
    const originalNode = this.draggedElement.nodes[this.draggingNodeIndex];
    for (const el of this.circuitService.getElements()) {
      if (el.id !== this.draggedElement.id && el.nodes.includes(originalNode)) {
        // If it's shared, clone it so dragging doesn't affect other elements
        const cloned = new Position(originalNode.x, originalNode.y);
        this.draggedElement.nodes[this.draggingNodeIndex] = cloned;
        break;
      }
    }

    // Step 2: re-fetch the possibly cloned node
    const node = this.draggedElement.nodes[this.draggingNodeIndex];

    // Step 3: apply snapping if enabled
    let intendedX = mouseX - this.offset.x;
    let intendedY = mouseY - this.offset.y;
    if (this.enableSnapping) {
      intendedX = Math.round(intendedX / this.gridSpacing) * this.gridSpacing;
      intendedY = Math.round(intendedY / this.gridSpacing) * this.gridSpacing;
    }

    // Step 4: lock axis if dragging a 2-node wire
    if (!this.dragAxis && this.draggedElement.nodes.length === 2) {
      const otherIndex = this.draggingNodeIndex === 0 ? 1 : 0;
      const otherNode = this.draggedElement.nodes[otherIndex];
      const dx = otherNode.x - node.x;
      const dy = otherNode.y - node.y;
      this.dragAxis = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
    }

    if (this.dragAxis === "horizontal") intendedY = node.y;
    if (this.dragAxis === "vertical") intendedX = node.x;

    // Step 5: apply movement
    node.x = intendedX;
    node.y = intendedY;
  }

  // Branch 2: Dragging the entire shape
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

    this.draggedElement.nodes = this.draggedElement.nodes.map(
      (n) => new Position(n.x + deltaX, n.y + deltaY)
    );
  }

  // Emit update event so the UI re-renders
  this.circuitService.emit("update", {
    type: "dragElement",
    element: this.draggedElement,
  });
}


  /**
   * Called on mouseup to finalize drag and check for any split conditions.
   * Includes:
   * - splitting a different wire body if a node touches it
   * - splitting the dragged wire if its body touches another node
   */
  stop() {
    if (
      this.draggedElement?.type === "wire" &&
      Array.isArray(this.draggedElement.nodes) &&
      this.draggedElement.nodes.length === 2
    ) {

      const [start, end] = this.draggedElement.nodes;

      // Case: a wire node was dragged (not full shape)
      if (this.draggingNodeIndex !== null) {
        const movedNode = this.draggedElement.nodes[this.draggingNodeIndex];
        const didSplit = this.wireSplitService.trySplitAtNode(movedNode);
        if (didSplit) {
          this._resetState();
          return;
        }
      }

      // Case: user dragged the whole wire and one of its nodes intersects a wire
      if (this.draggingNodeIndex === null) {
        for (const node of this.draggedElement.nodes) {
          const didSplit = this.wireSplitService.trySplitAtNode(node);
          if (didSplit) {
            this._resetState();
            return;
          }
        }
      }

      for (const element of this.circuitService.getElements()) {
        if (element.id === this.draggedElement.id) continue;

        for (const node of element.nodes) {
          // Case: dragged wire body touches another node
          const didSplit = this.wireSplitService.splitWireAtPointIfTouching(
            this.draggedElement,
            node
          );
          if (didSplit) {
            this._resetState();
            return;
          }

          // Case: dragged node touches another wire's body
          this.wireSplitService.trySplitAtNode(node);
        }
      }
    }

    this._resetState();
  }

  /**
   * Resets internal drag state variables after a drag completes.
   * @private
   */
  _resetState() {
    this.draggedElement = null;
    this.draggingNodeIndex = null;
    this.dragAxis = null;
  }

  /**
   * Finds the closest wire node to the click position.
   * @param {Element} element - The element to test (must be a wire).
   * @param {number} mouseX
   * @param {number} mouseY
   * @returns {number} Index of the closest node or -1 if not within range.
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
   * Determines if a mouse click occurred on the body of an element.
   * Uses bounding box and perpendicular distance tests.
   * @param {number} worldX
   * @param {number} worldY
   * @param {Element} element
   * @returns {boolean}
   */
  isInsideElement(worldX, worldY, element) {
    const auraSize = 10;
    if (!Array.isArray(element.nodes) || element.nodes.length < 2) return false;

    const [start, end] = element.nodes;
    const lineLength = Math.hypot(end.x - start.x, end.y - start.y);

    if (lineLength === 0) {
      return Math.hypot(worldX - start.x, worldY - start.y) <= auraSize;
    }

    const minX = Math.min(start.x, end.x) - auraSize;
    const maxX = Math.max(start.x, end.x) + auraSize;
    const minY = Math.min(start.y, end.y) - auraSize;
    const maxY = Math.max(start.y, end.y) + auraSize;
    if (worldX < minX || worldX > maxX || worldY < minY || worldY > maxY) return false;

    const distance =
      Math.abs(
        (end.y - start.y) * worldX -
        (end.x - start.x) * worldY +
        end.x * start.y -
        end.y * start.x
      ) / lineLength;

    return distance <= auraSize;
  }
}
