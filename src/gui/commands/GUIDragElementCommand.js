import { GUICommand } from "./GUICommand.js";
import { Position } from "../../domain/valueObjects/Position.js";
import { GRID_CONFIG } from "../../config/gridConfig.js";

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
   * @param {CircuitRenderer|WireSplitService} circuitRendererOrWireSplitService - Either the renderer (new signature) or wireSplitService (old signature).
   * @param {WireSplitService} wireSplitService - Handles wire-body and node-based splits (only used in new signature).
   */
  constructor(circuitService, circuitRendererOrWireSplitService, wireSplitService) {
    super();
    this.circuitService = circuitService;
    
    // Handle backwards compatibility
    if (wireSplitService) {
      // New signature: constructor(circuitService, circuitRenderer, wireSplitService)
      this.circuitRenderer = circuitRendererOrWireSplitService;
      this.wireSplitService = wireSplitService;
    } else {
      // Old signature: constructor(circuitService, wireSplitService)
      this.circuitRenderer = null;
      this.wireSplitService = circuitRendererOrWireSplitService;
    }

    this.draggedElement = null;
    this.selectedElements = []; // All elements being dragged
    this.elementOffsets = new Map(); // Store relative positions for each element

    // Distinguishes "dragging entire shape" vs. "dragging a single node"
    this.draggingNodeIndex = null;

    // For storing initial offset and original position
    this.offset = { x: 0, y: 0 };
    this.nodeStartPos = { x: 0, y: 0 };
    this.elementStartPos = new Map(); // Track initial positions for all elements
    this.actuallyMoved = false; // Track if any actual movement occurred

    // Axis lock: "horizontal", "vertical", or null
    this.dragAxis = null;

    // Snapping - use centralized grid configuration
    this.enableSnapping = true;

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
    // Reset movement tracking
    this.actuallyMoved = false;
    this.elementStartPos.clear();
    
    // Get currently selected elements (if circuitRenderer is available)
    const selectedElements = this.circuitRenderer ? this.circuitRenderer.getSelectedElements() : [];
    
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
          
          // Store initial position for movement tracking
          this.elementStartPos.set(element.id, {
            nodes: element.nodes.map(n => ({ x: n.x, y: n.y }))
          });
          
          // For node dragging, we only drag the specific node, not multiple elements
          this.selectedElements = [element];
          return;
        }
      }

      // Case 2: User clicked on a shape (or wire body)
      if (this.isInsideElement(mouseX, mouseY, element)) {
        this.draggedElement = element;
        this.draggingNodeIndex = null;
        this.dragAxis = null;

        // Store initial position for movement tracking
        this.elementStartPos.set(element.id, {
          nodes: element.nodes.map(n => ({ x: n.x, y: n.y }))
        });

        // Check if this element is part of a multi-selection
        if (selectedElements.length > 1 && selectedElements.includes(element)) {
          // Multi-element drag: setup all selected elements
          this.selectedElements = [...selectedElements];
          // Store initial positions for all selected elements
          for (const el of this.selectedElements) {
            if (!this.elementStartPos.has(el.id)) {
              this.elementStartPos.set(el.id, {
                nodes: el.nodes.map(n => ({ x: n.x, y: n.y }))
              });
            }
          }
          this.setupMultiElementDrag(mouseX, mouseY);
        } else {
          // Single element drag
          this.selectedElements = [element];
          if (Array.isArray(element.nodes) && element.nodes.length > 0) {
            const [startNode] = element.nodes;
            this.offset.x = mouseX - startNode.x;
            this.offset.y = mouseY - startNode.y;
          }
        }
        return;
      }
    }
  }

  /**
   * Setup multi-element dragging by calculating relative offsets for each element.
   * @param {number} mouseX - X coordinate of mouse.
   * @param {number} mouseY - Y coordinate of mouse.
   */
  setupMultiElementDrag(mouseX, mouseY) {
    this.elementOffsets.clear();
    
    for (const element of this.selectedElements) {
      if (Array.isArray(element.nodes) && element.nodes.length > 0) {
        const [startNode] = element.nodes;
        
        // Calculate offset from mouse to this element's first node
        const offset = {
          x: mouseX - startNode.x,
          y: mouseY - startNode.y
        };
        
        this.elementOffsets.set(element.id, offset);
      }
    }
    
    // Set the main offset for the clicked element
    if (Array.isArray(this.draggedElement.nodes) && this.draggedElement.nodes.length > 0) {
      const [startNode] = this.draggedElement.nodes;
      this.offset.x = mouseX - startNode.x;
      this.offset.y = mouseY - startNode.y;
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
      intendedX = GRID_CONFIG.snapToGrid(intendedX);
      intendedY = GRID_CONFIG.snapToGrid(intendedY);
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
    
    // Check if actual movement occurred
    if (!this.actuallyMoved) {
      const startPos = this.elementStartPos.get(this.draggedElement.id);
      if (startPos && startPos.nodes[this.draggingNodeIndex]) {
        const originalNode = startPos.nodes[this.draggingNodeIndex];
        if (Math.abs(node.x - originalNode.x) > 1 || Math.abs(node.y - originalNode.y) > 1) {
          this.actuallyMoved = true;
        }
      }
    }
  }

  // Branch 2: Dragging entire shapes (single or multiple elements)
  else {
    if (this.selectedElements.length > 1) {
      // Multi-element drag: move all selected elements maintaining relative positions
      this.moveMultipleElements(mouseX, mouseY);
    } else {
      // Single element drag (existing logic)
      const firstNode = this.draggedElement.nodes[0];
      let intendedX = mouseX - this.offset.x;
      let intendedY = mouseY - this.offset.y;

      if (this.enableSnapping) {
        intendedX = GRID_CONFIG.snapToGrid(intendedX);
        intendedY = GRID_CONFIG.snapToGrid(intendedY);
      }

      const deltaX = intendedX - firstNode.x;
      const deltaY = intendedY - firstNode.y;

      this.draggedElement.nodes = this.draggedElement.nodes.map(
        (n) => new Position(n.x + deltaX, n.y + deltaY)
      );
      
      // Check if actual movement occurred
      if (!this.actuallyMoved && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
        this.actuallyMoved = true;
      }
    }
  }

  // Emit update event so the UI re-renders
  this.circuitService.emit("update", {
    type: "dragElement",
    element: this.draggedElement,
    selectedElements: this.selectedElements,
  });
}

/**
 * Move multiple selected elements while maintaining their relative positions.
 * @param {number} mouseX - X coordinate of mouse.
 * @param {number} mouseY - Y coordinate of mouse.
 */
moveMultipleElements(mouseX, mouseY) {
  for (const element of this.selectedElements) {
    if (!Array.isArray(element.nodes) || element.nodes.length === 0) continue;
    
    const elementOffset = this.elementOffsets.get(element.id);
    if (!elementOffset) continue;
    
    const firstNode = element.nodes[0];
    let intendedX = mouseX - elementOffset.x;
    let intendedY = mouseY - elementOffset.y;

    if (this.enableSnapping) {
      intendedX = GRID_CONFIG.snapToGrid(intendedX);
      intendedY = GRID_CONFIG.snapToGrid(intendedY);
    }

    const deltaX = intendedX - firstNode.x;
    const deltaY = intendedY - firstNode.y;

    // Apply the same delta to all nodes of this element
    element.nodes = element.nodes.map(
      (n) => new Position(n.x + deltaX, n.y + deltaY)
    );
    
    // Check if actual movement occurred
    if (!this.actuallyMoved && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
      this.actuallyMoved = true;
    }
  }
}


  /**
   * Called on mouseup to finalize drag and check for any split conditions.
   * Includes:
   * - splitting a different wire body if a node touches it
   * - splitting the dragged wire if its body touches another node
   */
  stop() {
    // Only perform wire splitting checks if the element was actually moved
    if (
      this.actuallyMoved &&
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
          // Only check if the node was actually moved
          if (this.actuallyMoved) {
            this.wireSplitService.trySplitAtNode(node);
          }
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
    this.actuallyMoved = false;
    this.elementStartPos.clear();
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
